"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { getRemember } from "@/lib/auth/login-maintain";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  status: "loading" | "authenticated" | "anonymous";
};

const LOGIN_LIFETIME_MS = 60 * 60 * 1000;
const LOGOUT_AT_KEY = "FC_LOGOUT_AT";
const AuthContext = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthCtx["status"]>("loading");
  useEffect(() => {
    let mounted = true;
  
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setStatus(session ? "authenticated" : "anonymous");
    });
  
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setStatus(newSession ? "authenticated" : "anonymous");
      });
  
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    // 로그인 유지(remember)가 켜져 있으면 강제 로그아웃 타이머를 걸지 않음
    if (getRemember()) return;

    // 고정 만료시각 읽기(없으면 최초 설정)
    const stored = Number(localStorage.getItem(LOGOUT_AT_KEY));
    const hasStored = Number.isFinite(stored) && stored > 0;
    const logoutAt = hasStored ? stored : Date.now() + LOGIN_LIFETIME_MS;
    if (!hasStored) {
      localStorage.setItem(LOGOUT_AT_KEY, String(logoutAt));
    }

    const remaining = Math.max(0, logoutAt - Date.now());
    const id = window.setTimeout(async () => {
      try {
        await supabase.auth.signOut({ scope: "global" });
        await fetch("/auth/signout", { method: "POST" });
      } finally {
        localStorage.removeItem(LOGOUT_AT_KEY);
        clearTimeout(id);
      }
    }, remaining);

    return () => clearTimeout(id);
  }, [status, session, supabase]);



  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    status,
  };

  

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
