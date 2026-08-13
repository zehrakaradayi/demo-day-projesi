import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service role client — sadece server-side kod (server actions, route handlers)
// tarafından kullanılmalı. RLS'i bypass eder, asla client'a sızdırılmaz.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY veya NEXT_PUBLIC_SUPABASE_URL eksik.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
