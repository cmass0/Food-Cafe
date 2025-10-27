"use client";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "./auth/auth-context";
import AuthFlowHandler from "./auth/flow-handler";
import { AuthModalProvider } from "@/features/auth/ui/AuthModalProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <AuthFlowHandler />
        <AuthModalProvider>{children}</AuthModalProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}
