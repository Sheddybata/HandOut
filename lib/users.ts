import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export interface StoredUser {
  id: string;
  school: string;
  email: string;
  phone: string;
  passwordHash: string;
  name: string;
}

let cache: StoredUser[] | null = null;

async function load(): Promise<StoredUser[]> {
  if (cache) return cache;
  try {
    const raw = await readFile(USERS_FILE, "utf-8");
    cache = JSON.parse(raw) as StoredUser[];
    return cache ?? [];
  } catch {
    return [];
  }
}

async function save(users: StoredUser[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  cache = users;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;
    const db = supabase as any;

    const { data, error } = await db
      .from("users")
      .select("id, school, email, phone, password_hash, name")
      .eq("email", normalized)
      .maybeSingle();

    if (error) {
      console.error("Supabase findUserByEmail error:", error);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id as string,
      school: (data.school as string) ?? "",
      email: data.email as string,
      phone: (data.phone as string) ?? "",
      passwordHash: data.password_hash as string,
      name: (data.name as string) ?? (data.email as string).split("@")[0],
    };
  }

  const users = await load();
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function createUser(
  school: string,
  email: string,
  phone: string,
  passwordHash: string,
  name: string
): Promise<StoredUser> {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("EMAIL_IN_USE");
  const id = "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  const normalizedEmail = email.trim().toLowerCase();
  const user: StoredUser = {
    id,
    school: school.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    passwordHash,
    name: name.trim() || email.split("@")[0],
  };

  if (isSupabaseConfigured) {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
    const db = supabase as any;

    const { error } = await db.from("users").insert({
      id: user.id,
      school: user.school,
      email: user.email,
      phone: user.phone,
      password_hash: user.passwordHash,
      name: user.name,
    });

    if (error) {
      if (error.code === "23505") throw new Error("EMAIL_IN_USE");
      console.error("Supabase createUser error:", error);
      throw new Error("USER_CREATE_FAILED");
    }
    return user;
  }

  const users = await load();
  users.push(user);
  await save(users);
  return user;
}
