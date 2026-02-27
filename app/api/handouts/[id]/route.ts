import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHandoutById } from "@/lib/handouts";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id } = await params;
    const handout = await getHandoutById(id);
    if (!handout) {
      return NextResponse.json({ error: "Handout not found." }, { status: 404 });
    }
    if (handout.userId !== session.user.id) {
      return NextResponse.json({ error: "Not allowed to view this handout." }, { status: 403 });
    }

    return NextResponse.json({
      handoutId: handout.id,
      courseTitle: handout.courseTitle,
      courseCode: handout.courseCode,
      summary: handout.summary,
      quiz: handout.quiz,
      createdAt: handout.createdAt,
    });
  } catch (err) {
    console.error("Get handout error:", err);
    return NextResponse.json(
      { error: "Failed to load handout." },
      { status: 500 }
    );
  }
}
