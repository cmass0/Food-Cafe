"use client";

import { getBrowserSupabase } from "@/lib/supabase";

type Provider = "google" | "github" | "kakao" | "apple";

function signIn(provider: Provider) {
  const supabase = getBrowserSupabase();
  const next = new URLSearchParams(window.location.search).get("next") ?? "/profile";
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
}

export default function AuthButtons() {
  return (
    <div className="grid max-w-sm gap-2">
      <button type="button" onClick={() => signIn("google")}>Google로 로그인</button>
      <button type="button" onClick={() => signIn("github")}>GitHub로 로그인</button>
      <button type="button" onClick={() => signIn("kakao")}>카카오로 로그인</button>
      <button type="button" onClick={() => signIn("apple")}>Apple로 로그인</button>
    </div>
  );
}

