"use client";

import { getUser } from "@/domain/user/api";
import { deriveDisplayName } from "@/domain/user/lib/displayName";
import { getRemember } from "@/lib/auth/login-maintain";
import { getBrowserSupabase } from "@/lib/supabase";
import type { BrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Session, User } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";

type AuthCtx = {
  supabase: BrowserSupabaseClient;
  user: User | null;
  session: Session | null;
  status: "loading" | "authenticated" | "anonymous";
  displayName: string | null;
};

type AuthProviderProps = {
  children: React.ReactNode;
  initialSession?: Session | null;
};

const LOGIN_LIFETIME_MS = 60 * 60 * 1000;
const LOGOUT_AT_KEY = "FC_LOGOUT_AT";
const AuthContext = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children, initialSession = null }: AuthProviderProps) {
  const [supabase] = useState(getBrowserSupabase);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [status, setStatus] = useState<AuthCtx["status"]>(
    initialSession ? "authenticated" : "loading"
  );
  const [displayName, setDisplayName] = useState<string>("");
  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const fallbackDisplayName = user ? (deriveDisplayName(user) ?? "") : "";

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setStatus(session ? "authenticated" : "anonymous");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
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
    if (status !== "authenticated" || !userId) return;

    if (getRemember()) return;

    const stored = Number(localStorage.getItem(LOGOUT_AT_KEY));
    const hasStored = Number.isFinite(stored) && stored > 0;
    const logoutAt = hasStored ? stored : Date.now() + LOGIN_LIFETIME_MS;
    if (!hasStored) {
      localStorage.setItem(LOGOUT_AT_KEY, String(logoutAt));
    }

    const remaining = Math.max(0, logoutAt - Date.now());
    const id = window.setTimeout(async () => {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } finally {
        localStorage.removeItem(LOGOUT_AT_KEY);
        clearTimeout(id);
      }
    }, remaining);

    return () => clearTimeout(id);
  }, [status, supabase, userId]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      setDisplayName("");
      return;
    }
    // 공개 프로필의 화면용 정보는 public.profiles를 기준으로 갱신한다.
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const res = await getUser(userId);
        const profile = res?.data;
        if (cancelled) return;
        setDisplayName(profile?.display_name ?? fallbackDisplayName);
      } catch {
        if (!cancelled) setDisplayName(fallbackDisplayName);
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [fallbackDisplayName, status, userId]);

  const value: AuthCtx = {
    supabase,
    user,
    session,
    status,
    displayName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용 가능합니다.");
  return ctx;
}
