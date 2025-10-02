import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type ServerClient = ReturnType<typeof createServerClient>;

export async function getServerSupabase(): Promise<ServerClient> {
  const cookieStore = cookies();
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  if (!url || !anon) {
    throw new Error("[server] Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
}
