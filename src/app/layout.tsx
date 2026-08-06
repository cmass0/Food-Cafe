import Navbar from "@/component/navbar/nav-bar";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { getServerSupabase } from "@/lib/supabase/server";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased`}>
        <Providers initialSession={session}>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
