import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { school, email, phone, password } = body as Record<string, string>;

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(
      school?.trim() ?? "",
      email,
      phone?.trim() ?? "",
      passwordHash,
      body.name?.trim() ?? ""
    );

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      school: user.school,
      phone: user.phone,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_IN_USE") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
