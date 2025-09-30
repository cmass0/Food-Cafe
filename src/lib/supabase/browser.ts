import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

const globalForSupabase = globalThis as unknown as { _sbBrowser?: BrowserClient };

export function getBrowserSupabase(): BrowserClient {
  if (!globalForSupabase._sbBrowser) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error("[browser] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    globalForSupabase._sbBrowser = createBrowserClient(url, anon);
  }
  return globalForSupabase._sbBrowser!;
}


