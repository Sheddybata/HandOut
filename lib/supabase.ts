import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured) return null;
  if (adminClient) return adminClient;

  adminClient = createClient(supabaseUrl as string, supabaseServiceRoleKey as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}
