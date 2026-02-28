import OpenAI from "openai";
import type { SummaryPoint, QuizQuestion } from "./studyTypes";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

const SUMMARY_PROMPT = `You are an expert academic tutor with a strong focus on STEM (science, technology, engineering, and mathematics). Given raw text from a lecture handout or study material, produce a detailed, high-quality summary of the entire document, about 2–4 pages worth of content (roughly 1,200–2,200 words). Cover all major sections and ideas, preserving important definitions, formulas (with proper notation), theorems, examples, and reasoning steps. Write in clear academic prose that a university STEM student can revise from.
Summary formatting requirements:
- Provide 18–30 summary points.
- Each point must be substantive (typically 60–120 words, not one-liners).
- Keep points ordered logically from fundamentals to advanced ideas.

Output only valid JSON in this exact shape (no markdown, no extra text):
{
  "summary": [ { "id": "s1", "index": 1, "text": "First key point." }, ... ],
  "courseTitle": "Inferred course or document title (short)",
  "courseCode": "Short code e.g. MTH 101 or Handout"
}
Use short, unique ids (s1, s2, s3, etc.).`;

const QUIZ_PROMPT = `You are an expert academic tutor with a strong focus on STEM. Given raw text from a lecture handout or study material, produce exactly 20 multiple-choice questions that test understanding of the material. Each question has exactly 4 options with exactly one correct answer. Favor conceptual and applied understanding (definitions, formulas, problem-solving). Questions should be suitable for university-level STEM study and cover different parts of the material.

Output only valid JSON in this exact shape (no markdown, no extra text):
{
  "quiz": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": [
        { "id": "q1a", "label": "Option A", "isCorrect": false },
        { "id": "q1b", "label": "Option B", "isCorrect": true }
      ]
    }
  ]
}
Ensure every quiz question has exactly 4 options and exactly one option with "isCorrect": true. Provide exactly 20 questions (q1 through q20). Use short, unique ids (q1..q20, q1a..q1d, etc.).`;

export interface GenerateResult {
  summary: SummaryPoint[];
  quiz: QuizQuestion[];
  courseTitle: string;
  courseCode: string;
}

const MIN_SUMMARY_WORDS = 1200;

function countSummaryWords(summary: SummaryPoint[]): number {
  return summary
    .map((p) => p.text)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI response was not valid JSON and could not be parsed.");
    return JSON.parse(jsonMatch[0]) as T;
  }
}

function parseSummaryResponse(raw: string): {
  summary: SummaryPoint[];
  courseTitle: string;
  courseCode: string;
} {
  const parsed = parseJson<{
    summary?: { id: string; index: number; text: string }[];
    courseTitle?: string;
    courseCode?: string;
  }>(raw);

  const summary: SummaryPoint[] = (parsed.summary ?? []).map((s, i) => ({
    id: s.id ?? `s${i + 1}`,
    index: typeof s.index === "number" ? s.index : i + 1,
    text: String(s.text ?? "").trim() || "No content",
  })).filter((s) => s.text !== "No content");

  return {
    summary: summary.length ? summary : [{ id: "s1", index: 1, text: "No key points could be extracted from the document." }],
    courseTitle: String(parsed.courseTitle ?? "Handout").trim() || "Handout",
    courseCode: String(parsed.courseCode ?? "—").trim() || "—",
  };
}

function parseQuizResponse(raw: string): QuizQuestion[] {
  const parsed = parseJson<{
    quiz?: { id: string; question: string; options: { id: string; label: string; isCorrect: boolean }[] }[];
  }>(raw);

  const quiz: QuizQuestion[] = (parsed.quiz ?? []).map((q, i) => ({
    id: q.id ?? `q${i + 1}`,
    question: String(q.question ?? "").trim() || "Question",
    options: (q.options ?? []).slice(0, 4).map((o, j) => ({
      id: o.id ?? `q${i + 1}${String.fromCharCode(97 + j)}`,
      label: String(o.label ?? "").trim() || "Option",
      isCorrect: Boolean(o.isCorrect),
    })),
  })).filter((q) => q.question && q.options.length >= 2);

  return quiz;
}

const createChatOptions = (system: string, user: string) => ({
  model: "gpt-4o-mini" as const,
  messages: [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ],
  response_format: { type: "json_object" as const },
  temperature: 0.3,
});

export async function generateSummaryAndQuiz(extractedText: string): Promise<GenerateResult> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.local — see .env.example.");
  }

  const userPrompt = `Extract from this material:\n\n${extractedText}`;

  // Run summary and quiz generation in parallel for faster total time
  const [summaryRes, quizRes] = await Promise.all([
    openai.chat.completions.create(
      createChatOptions(SUMMARY_PROMPT, userPrompt)
    ),
    openai.chat.completions.create(
      createChatOptions(QUIZ_PROMPT, userPrompt)
    ),
  ]);

  const summaryRaw = summaryRes.choices[0]?.message?.content;
  const quizRaw = quizRes.choices[0]?.message?.content;

  if (!summaryRaw) throw new Error("Empty summary response from OpenAI");
  if (!quizRaw) throw new Error("Empty quiz response from OpenAI");

  const summaryResult = parseSummaryResponse(summaryRaw);
  const quiz = parseQuizResponse(quizRaw);

  if (countSummaryWords(summaryResult.summary) < MIN_SUMMARY_WORDS) {
    // Retry summary only if too short
    const retry = await openai.chat.completions.create({
      ...createChatOptions(
        SUMMARY_PROMPT + "\n\nIMPORTANT: The summary must be at least 1,200 words total and still follow the required JSON shape.",
        userPrompt
      ),
      temperature: 0.1,
    });
    const retryRaw = retry.choices[0]?.message?.content;
    if (!retryRaw) throw new Error("Empty retry response from OpenAI");
    const retryResult = parseSummaryResponse(retryRaw);
    return {
      summary: retryResult.summary,
      quiz,
      courseTitle: retryResult.courseTitle,
      courseCode: retryResult.courseCode,
    };
  }

  return {
    summary: summaryResult.summary,
    quiz,
    courseTitle: summaryResult.courseTitle,
    courseCode: summaryResult.courseCode,
  };
}
