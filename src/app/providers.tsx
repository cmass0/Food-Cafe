"use client";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "./context/Auth-context";
import Navbar from "@/component/nav-bar";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <Navbar />
        {children}
      </AuthProvider>
    </HeroUIProvider>
  );
}
