import "./globals.css";
import "react-quill/dist/quill.snow.css";
import { Inter } from "next/font/google";
import Providers from "./providers";
import type { ReactNode } from "react";
import NavBarServer from "@/components/nav/user-nav.server";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Providers>
          <NavBarServer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
