import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { SummaryPoint, QuizQuestion } from "./studyTypes";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const HANDOUTS_FILE = path.join(DATA_DIR, "handouts.json");

export interface StoredHandout {
  id: string;
  userId: string;
  filename: string;
  courseTitle: string;
  courseCode: string;
  summary: SummaryPoint[];
  quiz: QuizQuestion[];
  createdAt: string;
}

let cache: StoredHandout[] | null = null;

async function load(): Promise<StoredHandout[]> {
  if (cache) return cache;
  try {
    const raw = await readFile(HANDOUTS_FILE, "utf-8");
    cache = JSON.parse(raw) as StoredHandout[];
    return cache ?? [];
  } catch {
    return [];
  }
}

async function save(handouts: StoredHandout[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(HANDOUTS_FILE, JSON.stringify(handouts, null, 2), "utf-8");
  cache = handouts;
}

export async function getHandoutById(id: string): Promise<StoredHandout | null> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;
    const db = supabase as any;

    const { data, error } = await db
      .from("handouts")
      .select("id, user_id, filename, course_title, course_code, summary, quiz, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Supabase getHandoutById error:", error);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id as string,
      userId: data.user_id as string,
      filename: data.filename as string,
      courseTitle: data.course_title as string,
      courseCode: data.course_code as string,
      summary: Array.isArray(data.summary) ? (data.summary as SummaryPoint[]) : [],
      quiz: Array.isArray(data.quiz) ? (data.quiz as QuizQuestion[]) : [],
      createdAt: data.created_at as string,
    };
  }

  const handouts = await load();
  return handouts.find((h) => h.id === id) ?? null;
}

export async function getHandoutsByUserId(userId: string): Promise<StoredHandout[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];
    const db = supabase as any;

    const { data, error } = await db
      .from("handouts")
      .select("id, user_id, filename, course_title, course_code, summary, quiz, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getHandoutsByUserId error:", error);
      return [];
    }

    return (data ?? []).map((item: any) => ({
      id: item.id as string,
      userId: item.user_id as string,
      filename: item.filename as string,
      courseTitle: item.course_title as string,
      courseCode: item.course_code as string,
      summary: Array.isArray(item.summary) ? (item.summary as SummaryPoint[]) : [],
      quiz: Array.isArray(item.quiz) ? (item.quiz as QuizQuestion[]) : [],
      createdAt: item.created_at as string,
    }));
  }

  const handouts = await load();
  return handouts.filter((h) => h.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createHandout(
  id: string,
  userId: string,
  filename: string,
  courseTitle: string,
  courseCode: string,
  summary: SummaryPoint[],
  quiz: QuizQuestion[]
): Promise<StoredHandout> {
  const handout: StoredHandout = {
    id,
    userId,
    filename,
    courseTitle,
    courseCode,
    summary,
    quiz,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
    const db = supabase as any;

    const { data, error } = await db
      .from("handouts")
      .insert({
        id: handout.id,
        user_id: handout.userId,
        filename: handout.filename,
        course_title: handout.courseTitle,
        course_code: handout.courseCode,
        summary: handout.summary,
        quiz: handout.quiz,
      })
      .select("created_at")
      .single();

    if (error) {
      console.error("Supabase createHandout error:", error);
      throw new Error("HANDOUT_CREATE_FAILED");
    }

    if (data?.created_at) {
      handout.createdAt = data.created_at as string;
    }
    return handout;
  }

  const handouts = await load();
  handouts.push(handout);
  await save(handouts);
  return handout;
}
