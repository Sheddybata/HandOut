"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

function SignUpForm() {
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const loginUrl = "/login" + (callbackUrl !== "/" ? "?callbackUrl=" + encodeURIComponent(callbackUrl) : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            school: school.trim(),
            phone: phone.trim(),
            name: email.split("@")[0],
          },
        },
      });
      if (error) {
        setError(error.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
      const session = data.session;
      if (!session) {
        setLoading(false);
        setShowSuccessModal(true);
        return;
      }
      const signInRes = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (signInRes.error) {
        setShowSuccessModal(true);
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function goToLogin() {
    router.push(loginUrl);
  }

  return (
    <main id="main-content" className="min-h-screen w-full max-w-[480px] mx-auto flex flex-col justify-center px-4 bg-slate-50">
      {/* Success modal: check email to confirm */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pt-safe pb-safe bg-black/50"
          style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-success-title"
        >
          <div className="w-full max-w-[400px] rounded-t-[1.25rem] sm:rounded-intermediate-lg bg-white shadow-xl p-6 sm:p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" aria-hidden />
            </div>
            <h2 id="signup-success-title" className="text-xl font-semibold text-slate-800 mb-2">
              Registration complete
            </h2>
            <p className="text-slate-600 mb-6">
              Please check your email to confirm your sign-up. Once confirmed, you can sign in.
            </p>
            <button
              type="button"
              onClick={goToLogin}
              className="w-full min-h-[48px] rounded-intermediate bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors active:scale-[0.98]"
            >
              Go to sign in
            </button>
          </div>
        </div>
      )}

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
