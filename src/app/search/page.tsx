"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [q, setQ] = useState(params.get("query") ?? "");

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const usp = new URLSearchParams(params.toString());
    q ? usp.set("query", q) : usp.delete("query");
    router.replace(`${pathname}?${usp.toString()}`); // 히스토리 정리
  }, [q, params, pathname, router]);

  useEffect(() => { setQ(params.get("query") ?? ""); }, [params]);

  return (
    <form onSubmit={onSubmit} style={{ padding: "16px 0" }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="레시피·게시글 검색" />
      <button type="submit">검색</button>
    </form>
  );
}

export default function SearchHeader() {
  // useSearchParams는 Suspense 경계 안에서 쓰는 게 안전(SSR 바일아웃 방지)
  return (
    <Suspense fallback={<div>검색 준비중…</div>}>
      <SearchBar />
    </Suspense>
  );
}