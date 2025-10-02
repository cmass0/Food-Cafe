"use client";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "./context/Auth-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
