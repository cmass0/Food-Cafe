"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";

export default function AuthFlowHandler() {
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
        // no-op; surfaces via UI if needed
        console.error("Auth exchange failed", e);
      } finally {
        // Clean auth params from URL then refresh to sync server-side session
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

