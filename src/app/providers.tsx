"use client";
import { AuthChangeRefresher } from "@/components/auth/AuthChangeRefresher";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "sonner";

export default function Providers({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  return (
    <AuthProvider initialSession={initialSession}>
      <AuthModalProvider>
        <AuthChangeRefresher />
        {children}
        <Toaster position="top-center" richColors />
      </AuthModalProvider>
    </AuthProvider>
  );
}
