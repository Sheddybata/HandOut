import { NextRequest, NextResponse } from "next/server";
import { getHandoutsByUserId } from "@/lib/handouts";
import { getUserFromRequest } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const handouts = await getHandoutsByUserId(user.id);
    const list = handouts.map((h) => ({
      handoutId: h.id,
      courseTitle: h.courseTitle,
      courseCode: h.courseCode,
      createdAt: h.createdAt,
      summaryLength: h.summary.length,
      quizLength: h.quiz.length,
    }));

    return NextResponse.json({ handouts: list });
  } catch (err) {
    console.error("Saved list error:", err);
    return NextResponse.json(
      { error: "Failed to load saved handouts." },
      { status: 500 }
    );
  }
}
