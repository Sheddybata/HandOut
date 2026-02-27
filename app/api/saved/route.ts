import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHandoutsByUserId } from "@/lib/handouts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const handouts = await getHandoutsByUserId(session.user.id);
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
