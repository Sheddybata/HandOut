"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SignUpForm() {
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school, email, phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      setLoading(false);
      if (signInRes?.error) {
        setError("Account created. Please sign in on the login page.");
        return;
      }
      if (signInRes?.url) window.location.href = signInRes.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="min-h-screen w-full max-w-[480px] mx-auto flex flex-col justify-center px-4 bg-slate-50">
      <div className="rounded-intermediate-lg border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Create an account</h1>
        <p className="text-base text-slate-500 mb-8">
          Sign up to upload handouts, save summaries, and take quizzes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-intermediate border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          <label className="block">
            <span className="text-sm font-medium text-slate-700">School / Institution</span>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              autoComplete="organization"
              className="mt-1 block w-full min-h-[48px] rounded-intermediate border border-slate-300 px-3 text-slate-800 focus:border-trust-blue focus:outline-none focus:ring-1 focus:ring-trust-blue"
              placeholder="e.g. University of Lagos"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 block w-full min-h-[48px] rounded-intermediate border border-slate-300 px-3 text-slate-800 focus:border-trust-blue focus:outline-none focus:ring-1 focus:ring-trust-blue"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="mt-1 block w-full min-h-[48px] rounded-intermediate border border-slate-300 px-3 text-slate-800 focus:border-trust-blue focus:outline-none focus:ring-1 focus:ring-trust-blue"
              placeholder="e.g. 08012345678"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1 block w-full min-h-[48px] rounded-intermediate border border-slate-300 px-3 text-slate-800 focus:border-trust-blue focus:outline-none focus:ring-1 focus:ring-trust-blue"
              placeholder="At least 6 characters"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-intermediate bg-trust-blue text-white font-medium flex items-center justify-center hover:bg-trust-blue-dark disabled:opacity-60 transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600 text-center">
          Already have an account? <Link href={"/login?callbackUrl=" + encodeURIComponent(callbackUrl)} className="text-trust-blue hover:underline">Sign in</Link>
        </p>
        <p className="mt-2 text-sm text-slate-600 text-center">
          <Link href="/" className="text-trust-blue hover:underline">← Back to Home</Link>
        </p>
      </div>
    </main>
  );
}

function SignUpFallback() {
  return (
    <main id="main-content" className="min-h-screen w-full max-w-[480px] mx-auto flex flex-col justify-center px-4 bg-slate-50">
      <div className="rounded-intermediate-lg border border-slate-200 bg-white p-6">
        <div className="h-8 w-48 rounded bg-slate-200 animate-pulse mb-4" />
        <div className="h-10 rounded bg-slate-100 animate-pulse mb-4" />
        <div className="h-10 rounded bg-slate-100 animate-pulse" />
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpForm />
    </Suspense>
  );
}
