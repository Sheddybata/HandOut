/**
 * Tips and facts shown while summary/quiz are generating.
 * Academically inclined, study-friendly.
 */

export interface LoadingTip {
  type: "didYouKnow" | "funFact" | "studyTip" | "quote";
  text: string;
}

export const LOADING_TIPS: LoadingTip[] = [
  { type: "didYouKnow", text: "Spacing out revision over days (spaced repetition) improves long-term recall more than cramming." },
  { type: "didYouKnow", text: "The 1999 Constitution of Nigeria has been amended several times; the Fourth Alteration Act (2017) is among the most recent." },
  { type: "funFact", text: "Writing notes by hand activates more of the brain than typing and can help you remember better." },
  { type: "studyTip", text: "Explain a topic in your own words to test whether you really understand it—teaching is one of the best ways to learn." },
  { type: "quote", text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go. — Dr. Seuss" },
  { type: "didYouKnow", text: "Chapter IV of the Nigerian Constitution contains justiciable fundamental rights; Chapter II contains non-justiciable directive principles." },
  { type: "studyTip", text: "Short, focused study sessions (e.g. 25–30 min) with breaks often work better than long marathons." },
  { type: "funFact", text: "Testing yourself with quizzes strengthens memory more than re-reading the same material." },
  { type: "quote", text: "Education is the most powerful weapon which you can use to change the world. — Nelson Mandela" },
  { type: "studyTip", text: "Link new ideas to what you already know; connections make information easier to recall in exams." },
  { type: "didYouKnow", text: "Nigeria's legislature is bicameral: the Senate and the House of Representatives make up the National Assembly." },
  { type: "funFact", text: "Sleep after studying helps consolidate memories—so a good night's rest before an exam really does help." },
];
