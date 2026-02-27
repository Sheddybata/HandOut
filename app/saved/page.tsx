"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark, LogIn, FileText } from "lucide-react";

interface SavedItem {
  handoutId: string;
  courseTitle: string;
  courseCode: string;
  createdAt: string;
  summaryLength: number;
  quizLength: number;
}

export default function SavedPage() {
  const { data: session, status } = useSession();
  const [handouts, setHandouts] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    if (status !== "authenticated" || !session) {
      setLoading(false);
      return;
    }
    fetch("/api/saved")
      .then((res) => res.ok ? res.json() : { handouts: [] })
      .then((data) => {
        setHandouts(data.handouts ?? []);
      })
      .catch(() => setHandouts([]))
      .finally(() => setLoading(false));
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="h-8 w-48 rounded bg-slate-200 animate-pulse mb-2" />
        <div className="h-4 w-64 rounded bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <h1 className="text-slate-800 text-xl font-semibold mb-1">Saved</h1>
        <p className="text-slate-600 text-sm mb-6">
          Summaries and quizzes you save for review later.
        </p>
        <div className="rounded-intermediate-lg border border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
          <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center mb-4">
            <Bookmark className="h-7 w-7 text-slate-400" aria-hidden />
          </div>
          <h2 className="text-slate-800 font-semibold text-base mb-1">Sign in to view saved items</h2>
          <p className="text-slate-600 text-sm max-w-[280px] mb-5">
            Sign in to see your saved summaries and quizzes, and to save new ones from Home.
          </p>
          <Link
            href="/login?callbackUrl=/saved"
            className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-intermediate bg-trust-blue text-white font-medium px-6 hover:bg-trust-blue-dark"
          >
            <LogIn className="h-5 w-5" aria-hidden />
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const uniqueCourseCodes = Array.from(new Set(handouts.map((h) => h.courseCode))).sort();
  const filteredHandouts = handouts.filter((h) => {
    const matchesQuery =
      h.courseTitle.toLowerCase().includes(query.toLowerCase()) ||
      h.courseCode.toLowerCase().includes(query.toLowerCase());
    const matchesCode = courseFilter === "all" || h.courseCode === courseFilter;
    return matchesQuery && matchesCode;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <h1 className="text-slate-800 text-xl font-semibold mb-1">Saved</h1>
      <p className="text-slate-600 text-sm mb-6">
        Summaries and quizzes saved to your account. Open any to review.
      </p>

      {handouts.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or course code"
            className="min-h-[44px] rounded-intermediate border border-slate-300 px-3 text-sm text-slate-800 bg-white"
            aria-label="Search saved handouts"
          />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="min-h-[44px] rounded-intermediate border border-slate-300 px-3 text-sm text-slate-800 bg-white"
            aria-label="Filter by course code"
          >
            <option value="all">All course codes</option>
            {uniqueCourseCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      )}

      {handouts.length === 0 ? (
        <div className="rounded-intermediate-lg border border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
          <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center mb-4">
            <Bookmark className="h-7 w-7 text-slate-400" aria-hidden />
          </div>
          <h2 className="text-slate-800 font-semibold text-base mb-1">Nothing saved yet</h2>
          <p className="text-slate-600 text-sm max-w-[280px] mb-2">
            Upload a PDF on the Home tab. Summary and quiz are saved to your account automatically.
          </p>
          <p className="text-slate-500 text-xs max-w-[260px]">
            Sign in, then go to Home → Upload a PDF to get started.
          </p>
        </div>
      ) : filteredHandouts.length === 0 ? (
        <div className="rounded-intermediate-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-700 text-sm">No results for the current search/filter.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredHandouts.map((h) => (
            <li key={h.handoutId}>
              <Link
                href={`/?handout=${encodeURIComponent(h.handoutId)}`}
                className="flex items-center gap-4 rounded-intermediate-lg border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-trust-blue/10 text-trust-blue group-hover:scale-105 transition-transform duration-300">
                  <FileText className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-900 font-semibold truncate tracking-tight">{h.courseTitle}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{h.courseCode} · {h.summaryLength} points · {h.quizLength} questions</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
