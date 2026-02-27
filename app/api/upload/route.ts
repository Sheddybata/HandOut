import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "handouts";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || ".bin";
    const handoutId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const filename = `${handoutId}${ext}`;
    const bytes = await file.arrayBuffer();

    if (isSupabaseConfigured) {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json(
          { error: "Supabase is configured incorrectly on the server." },
          { status: 500 }
        );
      }

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, Buffer.from(bytes), {
          contentType: file.type || "application/pdf",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return NextResponse.json(
          { error: "Upload storage failed. Check Supabase bucket configuration." },
          { status: 500 }
        );
      }
    } else {
      const filepath = path.join(UPLOAD_DIR, filename);
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(filepath, Buffer.from(bytes));
    }

    return NextResponse.json({ handoutId, filename });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
