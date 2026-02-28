import path from "path";
import { readFile } from "fs/promises";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "handouts";

export async function extractTextFromPdf(_handoutId: string, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();

  if (ext !== ".pdf") {
    throw new Error("Only PDF files are supported for AI summary. Please upload a PDF.");
  }

  let buffer: Buffer;
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is configured incorrectly on the server.");
    }
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(filename);
    if (error || !data) {
      throw new Error("The PDF could not be read or has too little text. Try a different file.");
    }
    buffer = Buffer.from(await data.arrayBuffer());
  } else {
    const filepath = path.join(UPLOAD_DIR, filename);
    buffer = await readFile(filepath);
  }

  // Use unpdf - serverless-friendly, no canvas required
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const trimmed = (text ?? "").trim();
  if (!trimmed || trimmed.length < 50) {
    throw new Error("The PDF could not be read or has too little text. Try a different file.");
  }
  return trimmed;
}
