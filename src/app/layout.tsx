import Navbar from "@/components/navbar/nav-bar";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getServerSupabase } from "@/lib/supabase/server";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-config";
// 한글 본문 글꼴. 글자 범위별로 나눈 파일이라 화면에 쓰인 글자가 든 조각만 받는다.
// 영문도 Pretendard에 들어 있어(Inter 기반) 따로 영문 글꼴을 두지 않는다. 글꼴 이름은 globals.css의 --font-sans.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="ko">
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Providers initialSession={session}>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
