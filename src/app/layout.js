"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/component/nav-bar";
import { AuthProvider } from "./context/Auth-context";
import { HeroUIProvider } from "@heroui/react";

const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "Food Cafe",
//   description: "맛있는 레시피, 건강한 식습관을 공유하는 커뮤니티",
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen antialiased">
        <HeroUIProvider>
          <AuthProvider>
            <Navbar></Navbar>
            {children}
          </AuthProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
