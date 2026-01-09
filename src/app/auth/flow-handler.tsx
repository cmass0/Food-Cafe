"use client";

import { getBrowserSupabase } from "@/lib/supabase";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function AuthFlowHandlerInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams?.get("code");
    if (!code) return;
    const supabase = getBrowserSupabase();

    (async () => {
      try {
        await supabase.auth.exchangeCodeForSession(window.location.href);
      } catch (e) {
        console.error("Auth exchange failed", e);
      } finally {
        // url 정리 및 새로고침
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        url.searchParams.delete("scope");
        url.searchParams.delete("auth_type");
        url.searchParams.delete("provider");
        router.replace(url.pathname + (url.search ? url.search : "") + url.hash);
        router.refresh();
      }
    })();
    
  }, [pathname, searchParams, router]);

  return null;
}

export default function AuthFlowHandler() {
  return (
    <Suspense fallback={null}>
      <AuthFlowHandlerInner />
    </Suspense>
  );
}
