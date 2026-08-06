import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { normalizeReturnTo } from "@/lib/auth/return-to";
import type { Database } from "@/types/supabase";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const rawNext = req.nextUrl.searchParams.get("next") ?? "/";
  const next = normalizeReturnTo(rawNext);
  const redirectUrl = new URL(next, req.url);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(req.nextUrl.toString());
  if (error) {
    return NextResponse.redirect(new URL(`/`, req.url));
  }

  return response;
}
