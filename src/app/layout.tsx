import Navbar from "@/component/navbar/nav-bar";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "react-quill/dist/quill.snow.css";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
