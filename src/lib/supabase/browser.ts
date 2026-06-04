import { Database } from '@/types/supabase';
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRemember } from "../auth/login-maintain";

type BrowserClient = SupabaseClient<Database>;

const GLOBAL_SUPABASE_KEY = "__foodCafeSupabaseClient";

type BrowserGlobal = typeof globalThis & {
  [GLOBAL_SUPABASE_KEY]?: BrowserClient;
};

export function getBrowserSupabase(): BrowserClient {
  const globalStore = globalThis as BrowserGlobal;
  if (globalStore[GLOBAL_SUPABASE_KEY]) return globalStore[GLOBAL_SUPABASE_KEY];

  const remember = getRemember();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("[browser] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const client = createBrowserClient<Database>(url, anon,{
    auth: {
      persistSession: remember,
      autoRefreshToken: true,
    }
  } );
  globalStore[GLOBAL_SUPABASE_KEY] = client;
  return client;
}
