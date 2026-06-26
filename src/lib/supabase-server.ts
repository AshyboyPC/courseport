import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function serverSupabaseUrl() {
  return process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
}

function serverSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();
}

export function createServerSupabaseClient(authorizationHeader: string | null): SupabaseClient {
  const url = serverSupabaseUrl();
  const anonKey = serverSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error("Server Supabase configuration is missing.");
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: authorizationHeader
      ? {
          headers: { Authorization: authorizationHeader },
        }
      : undefined,
  });
}

export async function requireAuthenticatedServerUser(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new Error("Authenticated transcript request required.");
  }
  const supabase = createServerSupabaseClient(authorizationHeader);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Authenticated transcript request required.");
  return { supabase, user: data.user };
}
