"use client";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "./auth/auth-context";
import AuthFlowHandler from "./auth/flow-handler";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <AuthFlowHandler />
        {children}
      </AuthProvider>
    </HeroUIProvider>
  );
}
