"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  status: "loading" | "authenticated" | "anonymous";
};


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
