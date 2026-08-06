"use client";
import { AuthModalProvider } from "@/domain/auth/ui/AuthModalProvider";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider } from "./auth/auth-context";

export default function Providers({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  return (
    <AuthProvider initialSession={initialSession}>
      <AuthModalProvider>{children}</AuthModalProvider>
    </AuthProvider>
  );
}
