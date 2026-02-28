import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  school?: string;
  phone?: string;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || !data.user.email) return null;

  const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    data.user.email.split("@")[0];

  return {
    id: data.user.id,
    email: data.user.email,
    name,
    school: typeof metadata.school === "string" ? metadata.school : undefined,
    phone: typeof metadata.phone === "string" ? metadata.phone : undefined,
  };
}

export async function ensurePublicUserRecord(user: AuthenticatedUser): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { error } = await (supabase as any).from("users").upsert(
    {
      id: user.id,
      school: user.school ?? "",
      email: user.email,
      phone: user.phone ?? "",
      password_hash: "",
      name: user.name,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("ensurePublicUserRecord error:", error);
  }
}
