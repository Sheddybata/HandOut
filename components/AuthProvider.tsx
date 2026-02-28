"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabaseClient";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  school?: string;
  phone?: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapSessionUser(session: Session | null): AuthUser | null {
  const u = session?.user;
  if (!u?.id || !u.email) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    (typeof meta.name === "string" && meta.name.trim()) ||
    u.email.split("@")[0];
  const school = typeof meta.school === "string" ? meta.school : undefined;
  const phone = typeof meta.phone === "string" ? meta.phone : undefined;
  return {
    id: u.id,
    email: u.email,
    name: displayName,
    school,
    phone,
  };
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    supabaseClient.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const { data } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: mapSessionUser(session),
      accessToken: session?.access_token ?? null,
      signOut: async () => {
        await supabaseClient.auth.signOut();
      },
    }),
    [status, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default AuthProvider;
