"use client";

import Link from "next/link";
import { X } from "lucide-react";

interface SignUpPromptProps {
  open: boolean;
  onClose: () => void;
  context?: "upload" | "download" | "save";
}

const messages: Record<string, { title: string; body: string }> = {
  upload: {
    title: "Sign up to continue",
    body: "Create an account to process more handouts and save your summaries and quizzes.",
  },
  download: {
    title: "Sign up to download",
    body: "Sign up to download PDF summaries and save your materials.",
  },
  save: {
    title: "Sign up to save",
    body: "Sign up to save summaries and quizzes for review later.",
  },
};

export function SignUpPrompt({ open, onClose, context = "upload" }: SignUpPromptProps) {
  if (!open) return null;

  const { title, body } = messages[context];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pt-safe pb-safe bg-black/50 sm:bg-black/50"
      style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-prompt-title"
    >
      <div className="w-full max-w-[400px] rounded-t-[1rem] sm:rounded-intermediate-lg bg-white shadow-xl p-6 relative pb-safe">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 rounded-intermediate -translate-y-0.5"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4">
          <h2 id="signup-prompt-title" className="text-lg font-semibold text-slate-800">
            {title}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">{body}</p>
        </div>
        <div className="space-y-2">
          <Link
            href="/signup"
            className="block w-full min-h-[48px] rounded-intermediate bg-trust-blue text-white font-medium flex items-center justify-center hover:bg-trust-blue-dark"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="block w-full min-h-[48px] rounded-intermediate border-2 border-slate-300 text-slate-800 font-medium flex items-center justify-center hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
