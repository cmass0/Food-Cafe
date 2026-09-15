"use client";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider } from "./auth/auth-context";
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
        {children}
        <Toaster position="top-center" richColors />
      </AuthModalProvider>
    </AuthProvider>
  );
}
