import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/extractPdfText";
import { generateSummaryAndQuiz } from "@/lib/generateSummaryAndQuiz";
import { createHandout, getHandoutById } from "@/lib/handouts";
import { ensurePublicUserRecord, getUserFromRequest } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max for large PDFs + AI generation
const GUEST_TRIAL_COOKIE = "handout_guest_trial_used";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const userId = user?.id;
    const isSignedIn = Boolean(userId);

    if (!isSignedIn && request.cookies.get(GUEST_TRIAL_COOKIE)?.value === "1") {
      return NextResponse.json(
        { error: "Your free trial is used. Sign in to process and save more handouts." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const handoutId = body.handoutId as string | undefined;
    const filename = body.filename as string | undefined;

    if (!handoutId || !filename) {
      return NextResponse.json(
        { error: "handoutId and filename are required." },
        { status: 400 }
      );
    }

    if (isSignedIn) {
      const existing = await getHandoutById(handoutId);
      if (existing) {
        if (existing.userId !== userId) {
          return NextResponse.json({ error: "Not allowed to use this handout." }, { status: 403 });
        }
        return NextResponse.json({
          handoutId: existing.id,
          courseTitle: existing.courseTitle,
          courseCode: existing.courseCode,
          summary: existing.summary,
          quiz: existing.quiz,
        });
      }
    }

    const text = await extractTextFromPdf(handoutId, filename);
    const { summary, quiz, courseTitle, courseCode } = await generateSummaryAndQuiz(text);

    if (isSignedIn) {
      await ensurePublicUserRecord(user!);
      await createHandout(
        handoutId,
        userId as string,
        filename,
        courseTitle,
        courseCode,
        summary,
        quiz
      );

      return NextResponse.json({
        handoutId,
        courseTitle,
        courseCode,
        summary,
        quiz,
        saved: true,
      });
    }

    const response = NextResponse.json({
      handoutId,
      courseTitle,
      courseCode,
      summary,
      quiz,
      guestTrial: true,
    });
    response.cookies.set({
      name: GUEST_TRIAL_COOKIE,
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "AI is not configured yet. Please contact support." }, { status: 400 });
    }
    if (message.includes("Only PDF") || message.includes("could not be read")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.toLowerCase().includes("insufficient_quota") || message.toLowerCase().includes("quota")) {
      return NextResponse.json(
        { error: "AI quota reached. Please top up billing and try again." },
        { status: 429 }
      );
    }
    if (message.toLowerCase().includes("timeout") || message.toLowerCase().includes("timed out")) {
      return NextResponse.json(
        { error: "Request timed out while generating. Please try again." },
        { status: 504 }
      );
    }
    console.error("Process handout error:", err);
    return NextResponse.json(
      { error: "Generation failed due to a temporary issue or slow network. Please retry." },
      { status: 500 }
    );
  }
}
