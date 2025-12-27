"use client";
import { AuthModalProvider } from "@/domain/auth/ui/AuthModalProvider";
import { AuthProvider } from "./auth/auth-context";
import AuthFlowHandler from "./auth/flow-handler";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthFlowHandler />
      <AuthModalProvider>{children}</AuthModalProvider>
    </AuthProvider>
  );
}
