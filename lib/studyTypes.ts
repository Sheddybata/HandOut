export type MainTab = "upload" | "summary" | "quiz";

export interface SummaryPoint {
  id: string;
  index: number;
  text: string;
}

export interface QuizOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}
