"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    if (res?.url) window.location.href = res.url;
  }

  return (
    <main id="main-content" className="min-h-screen w-full max-w-[480px] mx-auto flex flex-col justify-center px-4 bg-slate-50">
      <div className="rounded-intermediate-lg border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Sign in</h1>
        <p className="text-base text-slate-500 mb-8">
          Sign in to save summaries and manage your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-intermediate border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </div>
          )}
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
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 block w-full min-h-[48px] rounded-intermediate border border-slate-300 px-3 text-slate-800 focus:border-trust-blue focus:outline-none focus:ring-1 focus:ring-trust-blue"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-intermediate bg-trust-blue text-white font-medium flex items-center justify-center hover:bg-trust-blue-dark disabled:opacity-60 transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600 text-center">
          Don&apos;t have an account?{" "}
          <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-trust-blue hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-sm text-slate-600 text-center">
          <Link href="/" className="text-trust-blue hover:underline">
            ← Back to Home
          </Link>
        </p>
      </div>
    </main>
  );
}

function LoginFallback() {
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
