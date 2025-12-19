import { Database } from '@/types/supabase';
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRemember } from "../auth/login-maintain";

type BrowserClient = SupabaseClient<Database>;

let client: BrowserClient | null = null;

export function getBrowserSupabase(): BrowserClient {
  if (client) return client;
  const remember = getRemember();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("[browser] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  client = createBrowserClient<Database>(url, anon,{
    auth: {
      persistSession: remember,
      autoRefreshToken: true,
    }
  } );
  return client;
}
