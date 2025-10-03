import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.redirect(new URL("/auth/signin?error=missing-supabase-config", req.url));
  }

  const rawNext = req.nextUrl.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";
  const newurl = new URL(next, req.url)
  const response = NextResponse.redirect(newurl);

  const supabase = createServerClient(url, anon, {
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
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user ?? null;
  if (user) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!existing) {
      const displayName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        (user.email?.split("@")[0] ?? "user");

      await supabase.from("users").insert({
        id: user.id,
        display_name: displayName,
        email: user.email,
        photo_url: (user.user_metadata?.picture as string | undefined) ?? null,
      });
    }
  }
  return response;
}
