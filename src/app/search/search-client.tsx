'use client';

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [q, setQ] = useState(params.get("query") ?? "");

  const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const usp = new URLSearchParams(params.toString());
    q ? usp.set("query", q) : usp.delete("query");
    router.replace(`${pathname}?${usp.toString()}`);
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
  return (
    <Suspense fallback={<div>검색 준비중…</div>}>
      <Inner />
    </Suspense>
  );
}