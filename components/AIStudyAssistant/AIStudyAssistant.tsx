"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  HelpCircle,
  Download,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ProcessingLoader } from "@/components/ui/ProcessingLoader";
import { SignUpPrompt } from "@/components/SignUpPrompt";
import { downloadSummaryPdf } from "@/lib/downloadSummaryPdf";
import { type MainTab, type SummaryPoint, type QuizQuestion } from "@/lib/studyTypes";

const TABS: { id: MainTab; label: string; icon: React.ElementType }[] = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
];

const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
};

type UploadErrorKind = "quota" | "timeout" | "network" | "auth" | "pdf" | "slow" | "generic";

function classifyError(message: string): UploadErrorKind {
  const lower = message.toLowerCase();
  if (lower.includes("quota")) return "quota";
  if (lower.includes("timed out") || lower.includes("timeout")) return "timeout";
  if (lower.includes("network")) return "network";
  if (lower.includes("sign in")) return "auth";
  if (lower.includes("pdf")) return "pdf";
  if (lower.includes("slow")) return "slow";
  return "generic";
}

export default function AIStudyAssistant() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<MainTab>("upload");
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [quizCurrent, setQuizCurrent] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success"; text: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorKind, setUploadErrorKind] = useState<UploadErrorKind>("generic");
  const [handoutId, setHandoutId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [lastProcessMeta, setLastProcessMeta] = useState<{ handoutId: string; filename: string } | null>(null);
  const [summary, setSummary] = useState<SummaryPoint[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>("Handout");
  const [courseCode, setCourseCode] = useState<string>("—");
  const [signUpPromptOpen, setSignUpPromptOpen] = useState(false);
  const [signUpPromptContext, setSignUpPromptContext] = useState<"upload" | "download" | "save">("upload");
  const [showPostTrySignUpBanner, setShowPostTrySignUpBanner] = useState(false);
  const isSignedIn = status === "authenticated" && !!session;
  const searchParams = useSearchParams();
  const handoutIdFromUrl = searchParams.get("handout");

  // Load a saved handout from URL (e.g. from Saved page)
  useEffect(() => {
    if (!handoutIdFromUrl || !isSignedIn) return;
    let cancelled = false;
    fetch(`/api/handouts/${encodeURIComponent(handoutIdFromUrl)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setHandoutId(data.handoutId);
        setSummary(data.summary ?? []);
        setQuiz(data.quiz ?? []);
        setCourseTitle(data.courseTitle ?? "Handout");
        setCourseCode(data.courseCode ?? "—");
        setHasUploaded(true);
        setSummaryLoaded(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [handoutIdFromUrl, isSignedIn]);

  // After first-time use (summary loaded), prompt to sign up once per session
  useEffect(() => {
    if (
      summaryLoaded &&
      !isSignedIn &&
      status !== "loading" &&
      typeof window !== "undefined" &&
      !sessionStorage.getItem("handout-signup-prompt-seen")
    ) {
      setShowPostTrySignUpBanner(true);
    }
  }, [summaryLoaded, isSignedIn, status]);

  const dismissPostTrySignUp = useCallback(() => {
    if (typeof window !== "undefined") sessionStorage.setItem("handout-signup-prompt-seen", "1");
    setShowPostTrySignUpBanner(false);
  }, []);

  const totalQuestions = quiz.length;
  const correctCount = quiz.filter(
    (q) => quizAnswers[q.id] && q.options.find((o) => o.id === quizAnswers[q.id])?.isCorrect
  ).length;
  const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const runGeneration = useCallback(async (meta: { handoutId: string; filename: string }) => {
    setSummaryLoading(true);
    setSummaryLoaded(false);
    setUploadMessage({ type: "success", text: "Uploaded. Generating summary…" });
    setLastProcessMeta(meta);
    try {
      const processRes = await fetch("/api/handouts/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
      const processData = await processRes.json().catch(() => ({}));
      if (!processRes.ok) {
        const message = processData.error ?? "Failed to generate summary and quiz.";
        setUploadError(message);
        setUploadErrorKind(classifyError(message));
        if (classifyError(message) === "auth" && !isSignedIn) {
          setSignUpPromptContext("upload");
          setSignUpPromptOpen(true);
        }
        return;
      }
      setSummary(processData.summary ?? []);
      setQuiz(processData.quiz ?? []);
      setCourseTitle(processData.courseTitle ?? "Handout");
      setCourseCode(processData.courseCode ?? "—");
      setQuizCurrent(0);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setSummaryLoaded(true);
      setUploadError(null);
    } catch {
      const message = "Slow network or temporary connection issue. Please retry generation.";
      setUploadError(message);
      setUploadErrorKind("slow");
    } finally {
      setSummaryLoading(false);
      setUploadMessage(null);
    }
  }, [isSignedIn]);

  const startProcessing = useCallback(async (file: File | null) => {
    setUploadError(null);
    setUploadErrorKind("generic");
    let uploadedHandoutId: string | null = null;
    let uploadedFilename: string | null = null;
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadError(data.error ?? "Upload failed. Please try again.");
          return;
        }
        uploadedHandoutId = data.handoutId ?? null;
        uploadedFilename = data.filename ?? null;
        setHandoutId(uploadedHandoutId);
        setFilename(uploadedFilename);
      } catch {
        setUploadError("Network error. Please check your connection and try again.");
        return;
      }
    }
    if (!uploadedHandoutId || !uploadedFilename) {
      setUploadError("Upload did not return handout id. Please try again.");
      return;
    }
    setHasUploaded(true);
    setActiveTab("summary");
    await runGeneration({ handoutId: uploadedHandoutId, filename: uploadedFilename });
  }, [isSignedIn, runGeneration]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files?.length) {
        startProcessing(files[0] as File);
      }
    },
    [startProcessing]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) {
        startProcessing(files[0] as File);
      }
      e.target.value = "";
    },
    [startProcessing]
  );

  const handleDownloadPdf = useCallback(() => {
    if (!isSignedIn) {
      setSignUpPromptContext("download");
      setSignUpPromptOpen(true);
      return;
    }
    downloadSummaryPdf(courseCode, courseTitle, summary);
  }, [isSignedIn, courseCode, courseTitle, summary]);

  const dismissError = useCallback(() => setUploadError(null), []);

  const retryGeneration = useCallback(async () => {
    if (!lastProcessMeta) return;
    setActiveTab("summary");
    await runGeneration(lastProcessMeta);
  }, [lastProcessMeta, runGeneration]);

  const goToUpload = useCallback(() => setActiveTab("upload"), []);

  const retryQuiz = useCallback(() => {
    setQuizCurrent(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
  }, []);

  const selectQuizOption = useCallback((questionId: string, optionId: string) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, [quizSubmitted]);

  const goNext = useCallback(() => {
    if (quizCurrent < quiz.length - 1) setQuizCurrent((c) => c + 1);
    else setQuizSubmitted(true);
  }, [quizCurrent, quiz.length]);

  const goPrev = useCallback(() => {
    if (quizCurrent > 0) setQuizCurrent((c) => c - 1);
  }, [quizCurrent]);

  const isAnswered = useCallback(
    (questionId: string) => Boolean(quizAnswers[questionId]),
    [quizAnswers]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <SignUpPrompt
        open={signUpPromptOpen}
        onClose={() => setSignUpPromptOpen(false)}
        context={signUpPromptContext}
      />
      {showPostTrySignUpBanner && !isSignedIn && (
        <div className="shrink-0 border-b border-slate-200 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-700">Like what you see? Sign up to save your summaries and access them from any device.</p>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/signup"
              className="min-h-[44px] rounded-intermediate bg-trust-blue text-white px-4 text-sm font-medium flex items-center justify-center hover:bg-trust-blue-dark"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="min-h-[44px] rounded-intermediate border border-slate-300 text-slate-800 px-4 text-sm font-medium flex items-center justify-center hover:bg-slate-100"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={dismissPostTrySignUp}
              className="min-h-[44px] rounded-intermediate px-3 text-sm text-slate-600 hover:text-slate-800"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
      {/* Header + Segmented control */}
      <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200/50 bg-white/80 backdrop-blur-md px-4 pt-safe pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Image
            src="/handoutlogo.png"
            alt="HandOut logo"
            width={28}
            height={28}
            className="object-contain"
            priority
          />
          <h1 className="text-slate-900 text-lg font-semibold tracking-tight">HandOut</h1>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed mb-4 max-w-[360px]">
          Upload your materials — get a summary and quiz in seconds.
        </p>
        {hasUploaded && (courseCode !== "—" || courseTitle !== "Handout") && (
          <p className="text-slate-500 text-xs mb-2" aria-label="Current handout">
            {courseCode} · {courseTitle}
          </p>
        )}
        <div
          role="tablist"
          className="grid grid-cols-3 gap-1 p-1 rounded-intermediate bg-slate-100 border border-slate-200"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`panel-${id}`}
              id={`tab-${id}`}
              className={cn(
                "touch-target min-h-[48px] rounded-[12px] flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                activeTab === id
                  ? "bg-trust-blue text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              )}
              onClick={() => setActiveTab(id)}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Tab panels — single-column feed; momentum scroll on iOS */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === "upload" && (
            <motion.section
              key="upload"
              id="panel-upload"
              role="tabpanel"
              aria-labelledby="tab-upload"
              initial={slideUp.initial}
              animate={slideUp.animate}
              exit={slideUp.exit}
              transition={slideUp.transition}
              className="space-y-4"
            >
              {uploadError && (
                <div
                  role="alert"
                  className="rounded-intermediate border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div className="space-y-1">
                      <p>{uploadError}</p>
                      {uploadErrorKind === "quota" && (
                        <p className="text-xs text-red-800">
                          OpenAI usage limit reached. Add credit in your OpenAI billing dashboard, then retry.
                        </p>
                      )}
                      {uploadErrorKind === "timeout" && (
                        <p className="text-xs text-red-800">Large files can take longer; retry keeps your uploaded file.</p>
                      )}
                      {uploadErrorKind === "auth" && (
                        <p className="text-xs text-red-800">Your session may have expired. Sign in again and retry.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lastProcessMeta && (
                      <button
                        type="button"
                        onClick={retryGeneration}
                        className="min-h-[44px] rounded-intermediate border border-red-300 bg-white px-4 font-medium text-red-700 hover:bg-red-50"
                      >
                        Retry generation
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={dismissError}
                      className="min-h-[44px] rounded-intermediate border border-red-300 bg-white px-4 font-medium text-red-700 hover:bg-red-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "rounded-intermediate-lg border-2 border-dashed min-h-[200px] flex flex-col items-center justify-center gap-3 p-6 transition-colors",
                  isDragging ? "border-trust-blue bg-trust-blue/5" : "border-slate-300 bg-slate-50"
                )}
              >
                <Upload className="h-10 w-10 text-slate-400" aria-hidden />
                <p className="text-slate-600 text-sm text-center">
                  Drag & drop a PDF here, or click to browse (PDF only for AI summary)
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="sr-only"
                    onChange={handleFileInput}
                  />
                  <span className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-intermediate bg-trust-blue text-white px-5 text-sm font-medium hover:bg-trust-blue-dark">
                    Choose files
                  </span>
                </label>
              </div>
            </motion.section>
          )}

          {activeTab === "summary" && (
            <motion.section
              key="summary"
              id="panel-summary"
              role="tabpanel"
              aria-labelledby="tab-summary"
              initial={slideUp.initial}
              animate={slideUp.animate}
              exit={slideUp.exit}
              transition={slideUp.transition}
              className="space-y-4"
            >
              {!hasUploaded ? (
                <div className="rounded-intermediate-lg border border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-center min-h-[240px]">
                  <FileText className="h-12 w-12 text-slate-300 mb-3" aria-hidden />
                  <h2 className="text-slate-800 font-semibold text-base mb-1">No summary yet</h2>
                  <p className="text-slate-600 text-sm mb-5 max-w-[280px]">
                    Upload a handout to generate an AI summary.
                  </p>
                  <button
                    type="button"
                    onClick={goToUpload}
                    className="min-h-[48px] rounded-intermediate bg-trust-blue text-white font-medium px-6 hover:bg-trust-blue-dark transition-all duration-200 active:scale-[0.98]"
                  >
                    Upload a handout
                  </button>
                </div>
              ) : summaryLoading ? (
                <ProcessingLoader />
              ) : summaryLoaded ? (
                <>
                  <ul className="space-y-5 md:space-y-6">
                    {summary.map((point) => (
                      <li key={point.id} className="flex gap-3">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-trust-blue text-white text-sm font-semibold"
                          aria-hidden
                        >
                          {point.index}
                        </span>
                        <p className="text-slate-700 text-base leading-7 md:leading-8 pt-0.5">
                          {point.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="w-full min-h-[48px] rounded-intermediate bg-trust-blue text-white font-medium flex items-center justify-center gap-2 hover:bg-trust-blue-dark transition-all duration-200 active:scale-[0.98]"
                    >
                      <Download className="h-5 w-5" aria-hidden />
                      Download PDF Summary
                    </button>
                  </div>
                </>
              ) : null}
            </motion.section>
          )}

          {activeTab === "quiz" && (
            <motion.section
              key="quiz"
              id="panel-quiz"
              role="tabpanel"
              aria-labelledby="tab-quiz"
              initial={slideUp.initial}
              animate={slideUp.animate}
              exit={slideUp.exit}
              transition={slideUp.transition}
              className="space-y-4"
            >
              {!hasUploaded ? (
                <div className="rounded-intermediate-lg border border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-center min-h-[240px]">
                  <HelpCircle className="h-12 w-12 text-slate-300 mb-3" aria-hidden />
                  <h2 className="text-slate-800 font-semibold text-base mb-1">No quiz yet</h2>
                  <p className="text-slate-600 text-sm mb-5 max-w-[280px]">
                    Upload a handout first to generate a practice quiz based on your material.
                  </p>
                  <button
                    type="button"
                    onClick={goToUpload}
                    className="min-h-[48px] rounded-intermediate bg-trust-blue text-white font-medium px-6 hover:bg-trust-blue-dark transition-all duration-200 active:scale-[0.98]"
                  >
                    Upload a handout
                  </button>
                </div>
              ) : summaryLoading ? (
                <ProcessingLoader />
              ) : quiz.length === 0 ? (
                <div className="rounded-intermediate-lg border border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <HelpCircle className="h-12 w-12 text-slate-300 mb-3" aria-hidden />
                  <h2 className="text-slate-800 font-semibold text-base mb-1">No quiz generated</h2>
                  <p className="text-slate-600 text-sm">This handout did not yield quiz questions. You can still use the Summary tab.</p>
                </div>
              ) : (
                <>
                  <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
                    <span className="text-slate-600 text-sm">
                      Question {quizCurrent + 1} of {totalQuestions}
                    </span>
                    {quizSubmitted && (
                      <span className="rounded-intermediate bg-emerald-700 text-white px-3 py-1 text-sm font-semibold">
                        Score: {score}%
                      </span>
                    )}
                  </div>

                  {!quizSubmitted ? (
                    <>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {quiz.map((q, index) => {
                          const answered = isAnswered(q.id);
                          const active = index === quizCurrent;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setQuizCurrent(index)}
                              className={cn(
                                "min-h-[36px] rounded-full border px-3 text-xs font-medium",
                                active
                                  ? "border-trust-blue bg-trust-blue text-white"
                                  : answered
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : "border-slate-300 bg-white text-slate-700"
                              )}
                              aria-label={`Question ${index + 1} ${answered ? "answered" : "unanswered"}`}
                            >
                              Q{index + 1} · {answered ? "Answered" : "Unanswered"}
                            </button>
                          );
                        })}
                      </div>

                      <div className="md:grid md:grid-cols-[1fr_190px] md:gap-4">
                        <div className="space-y-2">
                          <div className="rounded-intermediate-lg border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white p-4 md:p-6">
                            <p className="text-slate-900 font-semibold text-base leading-relaxed tracking-tight">
                              {quiz[quizCurrent].question}
                            </p>
                          </div>
                          <ul className="space-y-2" role="radiogroup" aria-label="Choose an answer">
                            {quiz[quizCurrent].options.map((opt) => {
                              const selected = quizAnswers[quiz[quizCurrent].id] === opt.id;
                              return (
                                <li key={opt.id}>
                                  <button
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    className={cn(
                                      "w-full min-h-[56px] rounded-intermediate border-2 text-left px-4 py-3 grid grid-cols-[20px_1fr] items-start gap-3 transition-all duration-200 active:scale-[0.99]",
                                      selected
                                        ? "border-trust-blue bg-trust-blue/10 text-slate-900 shadow-sm"
                                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:shadow-sm"
                                    )}
                                    onClick={() =>
                                      selectQuizOption(quiz[quizCurrent].id, opt.id)
                                    }
                                  >
                                    <span
                                      className={cn(
                                        "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                                        selected ? "border-trust-blue bg-trust-blue" : "border-slate-500"
                                      )}
                                    >
                                      {selected && (
                                        <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
                                      )}
                                    </span>
                                    <span className="leading-6 break-words">{opt.label}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        <aside className="hidden md:block rounded-intermediate-lg border border-slate-200 bg-white p-3 h-fit sticky top-20">
                          <p className="text-xs font-semibold text-slate-600 mb-2">Question Navigator</p>
                          <div className="grid grid-cols-4 gap-2">
                            {quiz.map((q, index) => (
                              <button
                                key={`nav-${q.id}`}
                                type="button"
                                onClick={() => setQuizCurrent(index)}
                                className={cn(
                                  "min-h-[36px] min-w-[36px] rounded-md text-xs font-semibold border",
                                  index === quizCurrent
                                    ? "bg-trust-blue text-white border-trust-blue"
                                    : isAnswered(q.id)
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : "bg-white text-slate-700 border-slate-300"
                                )}
                                aria-label={`Go to question ${index + 1}`}
                              >
                                {index + 1}
                              </button>
                            ))}
                          </div>
                        </aside>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={goPrev}
                          disabled={quizCurrent === 0}
                          className="min-h-[48px] min-w-[48px] rounded-intermediate border border-slate-300 text-slate-600 disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <ChevronRight className="h-5 w-5 rotate-180" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={goNext}
                          className="flex-1 min-h-[48px] rounded-intermediate bg-trust-blue text-white font-medium hover:bg-trust-blue-dark transition-all duration-200 active:scale-[0.98]"
                        >
                          {quizCurrent === totalQuestions - 1 ? "Submit" : "Next"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-intermediate-lg border border-slate-200 bg-slate-50 p-4 md:p-6 space-y-4">
                      <div className="text-center space-y-2">
                        <p className="text-slate-900 font-semibold text-lg">Quiz complete</p>
                        <p className="text-slate-700">
                          You got {correctCount} of {totalQuestions} correct ({score}%).
                        </p>
                      </div>
                      <ul className="space-y-3">
                        {quiz.map((question, index) => {
                          const selectedId = quizAnswers[question.id];
                          const selectedOpt = question.options.find((o) => o.id === selectedId);
                          const correctOpt = question.options.find((o) => o.isCorrect);
                          const isCorrect = selectedOpt?.isCorrect === true;
                          return (
                            <li key={question.id} className="rounded-intermediate border border-slate-200 bg-white p-4 space-y-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {index + 1}. {question.question}
                              </p>
                              <div className="flex items-start gap-2 text-sm">
                                {isCorrect ? (
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" aria-hidden />
                                ) : (
                                  <XCircle className="mt-0.5 h-4 w-4 text-rose-700" aria-hidden />
                                )}
                                <p className={cn("leading-6", isCorrect ? "text-emerald-800" : "text-rose-800")}>
                                  Your answer: {selectedOpt?.label ?? "No answer selected"}
                                </p>
                              </div>
                              {!isCorrect && correctOpt && (
                                <p className="text-sm leading-6 text-slate-700">
                                  Correct answer: <span className="font-medium text-slate-900">{correctOpt.label}</span>
                                </p>
                              )}
                              <p className="text-xs leading-5 text-slate-600">
                                Explanation: The correct option best matches the key concept stated in the generated summary for this topic.
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                      <button
                        type="button"
                        onClick={retryQuiz}
                        className="min-h-[48px] rounded-intermediate border-2 border-trust-blue text-trust-blue font-medium flex items-center justify-center gap-2 mx-auto px-6 hover:bg-trust-blue/5 transition-all duration-200 active:scale-[0.98]"
                      >
                        <RotateCcw className="h-5 w-5" aria-hidden />
                        Retry quiz
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
