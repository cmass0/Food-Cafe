import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.redirect(new URL("/auth/signin?error=missing-supabase-config", req.url));
  }

  const next = req.nextUrl.searchParams.get("next") ?? "/profile";
  const response = NextResponse.redirect(new URL(next, req.url));

  const supabase = createServerClient(url, anon, {
    cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options: CookieOptions) => {
        response.cookies.set({ name, value, ...options });
      },
      remove: (name, options: CookieOptions) => {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(req.nextUrl);
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }

  return response;
}

