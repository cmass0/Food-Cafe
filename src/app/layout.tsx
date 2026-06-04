import Navbar from "@/component/navbar/nav-bar";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
