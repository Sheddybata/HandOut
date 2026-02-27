"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOADING_TIPS, type LoadingTip } from "@/lib/loadingTips";

const STEP_LABELS = [
  "Uploading your handout…",
  "Reading your handout…",
  "Highlighting key points…",
  "Summarizing your key points…",
  "Generating questions…",
  "Preparing your quiz…",
];

function getTipLabel(tip: LoadingTip): string {
  switch (tip.type) {
    case "didYouKnow":
      return "Did you know?";
    case "funFact":
      return "Fun fact";
    case "studyTip":
      return "Study tip";
    case "quote":
      return "Quote";
    default:
      return "Tip";
  }
}

export function ProcessingLoader() {
  const [step, setStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const tip = LOADING_TIPS[tipIndex % LOADING_TIPS.length];
  const label = getTipLabel(tip);

  // Cycle through steps every ~0.8s (total ~2.4s for 3 steps, then repeat)
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((s) => (s + 1) % STEP_LABELS.length);
    }, 800);
    return () => clearInterval(stepInterval);
  }, []);

  // Cycle through tips every 5s
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((i) => i + 1);
    }, 5000);
    return () => clearInterval(tipInterval);
  }, []);

  return (
    <div className="space-y-5" role="status" aria-live="polite" aria-label="Preparing your study materials">
      {/* Progress steps */}
      <div className="rounded-intermediate-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-trust-blue/10">
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-trust-blue border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <FileText className="h-5 w-5 text-trust-blue" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800">
              {STEP_LABELS[step]}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn(
                  "h-full w-1/2 rounded-full bg-gradient-to-r from-trust-blue/80 via-trust-blue to-trust-blue/80",
                  "animate-[shimmer_1.8s_linear_infinite]"
                )}
                aria-hidden
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              This usually takes around 2–5 minutes. Please don&apos;t close the
              app.
            </p>
          </div>
        </div>
      </div>

      {/* Rotating tip card */}
      <div className="rounded-intermediate-lg border border-slate-200 bg-white p-4 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Lightbulb className="h-4 w-4 text-amber-600" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-700">
                {tip.text}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
