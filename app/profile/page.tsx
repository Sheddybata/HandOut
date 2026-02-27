"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  User,
  LogIn,
  LogOut,
  Mail,
  Phone,
  Building2,
  LockKeyhole,
  BadgeCheck,
} from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  if (status === "loading") {
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
        <h1 className="text-slate-800 text-xl font-semibold mb-1">Profile</h1>
        <p className="text-slate-600 text-sm mb-6">
          Manage your account details and settings.
        </p>
        <div className="rounded-intermediate-lg border border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
          <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center mb-4">
            <User className="h-7 w-7 text-slate-400" aria-hidden />
          </div>
          <h2 className="text-slate-800 font-semibold text-base mb-1">Sign in to manage your account</h2>
          <p className="text-slate-600 text-sm max-w-[280px] mb-5">
            Sign in to update your profile, change your password, and manage preferences.
          </p>
          <Link
            href="/login?callbackUrl=/profile"
            className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-intermediate bg-trust-blue text-white font-medium px-6 hover:bg-trust-blue-dark"
          >
            <LogIn className="h-5 w-5" aria-hidden />
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const initials = (user?.name || user?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <h1 className="text-slate-800 text-xl font-semibold mb-1">Profile</h1>
      <p className="text-slate-600 text-sm mb-6">
        Manage your account details and settings.
      </p>

      <div className="rounded-intermediate-lg border border-slate-200 bg-white p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-trust-blue text-white font-semibold flex items-center justify-center">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 font-semibold truncate">{user?.name ?? "User"}</p>
            <p className="text-slate-600 text-sm truncate">{user?.email ?? "—"}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-intermediate border border-slate-200 bg-slate-50 px-3 py-3 flex items-start gap-3">
            <Mail className="h-4 w-4 text-slate-500 mt-1" aria-hidden />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</p>
              <p className="text-slate-900 mt-0.5 break-all">{user?.email ?? "—"}</p>
            </div>
          </div>

          <div className="rounded-intermediate border border-slate-200 bg-slate-50 px-3 py-3 flex items-start gap-3">
            <User className="h-4 w-4 text-slate-500 mt-1" aria-hidden />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</p>
              <p className="text-slate-900 mt-0.5">{user?.name ?? "—"}</p>
            </div>
          </div>

          {(user as { school?: string })?.school && (
            <div className="rounded-intermediate border border-slate-200 bg-slate-50 px-3 py-3 flex items-start gap-3">
              <Building2 className="h-4 w-4 text-slate-500 mt-1" aria-hidden />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">School</p>
                <p className="text-slate-900 mt-0.5">{(user as { school?: string }).school}</p>
              </div>
            </div>
          )}

          {(user as { phone?: string })?.phone && (
            <div className="rounded-intermediate border border-slate-200 bg-slate-50 px-3 py-3 flex items-start gap-3">
              <Phone className="h-4 w-4 text-slate-500 mt-1" aria-hidden />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</p>
                <p className="text-slate-900 mt-0.5">{(user as { phone?: string }).phone}</p>
              </div>
            </div>
          )}
        </div>

        <section className="rounded-intermediate border border-slate-200 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <LockKeyhole className="h-4 w-4 text-slate-600 mt-1" aria-hidden />
            <div>
              <h2 className="text-slate-900 font-semibold">Account Security</h2>
              <p className="text-slate-600 text-sm">
                Security controls are being rolled out in phases.
              </p>
            </div>
          </div>

          <div className="grid gap-2 text-sm">
            <p className="text-slate-700">
              <span className="font-medium">Sign-in method:</span> Email and password
            </p>
            <p className="text-slate-700">
              <span className="font-medium">Email verification:</span> Verification status unavailable
            </p>
          </div>

          <div className="rounded-intermediate bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 flex items-start gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-700 mt-0.5" aria-hidden />
            Additional account security controls will be announced in a future update.
          </div>
        </section>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="min-h-[48px] w-full rounded-intermediate border-2 border-slate-300 text-slate-700 font-medium flex items-center justify-center gap-2 hover:bg-slate-50"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );
}
