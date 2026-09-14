import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client. `import "server-only"` above makes any accidental
// import from a "use client" boundary fail the build instead of leaking the
// service-role key into the browser bundle -- this key bypasses every RLS
// policy, so it must never exist outside a server module.
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is required to create the Supabase admin client",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required to create the Supabase admin client",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
