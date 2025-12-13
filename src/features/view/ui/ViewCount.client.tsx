"use client";

import * as React from "react";

type ViewType = "post" | "recipe";

type ViewCountProps = {
  type: ViewType;
  id: string;
  initialCount: number;
  dedupeMs?: number;
};

function buildUrl(type: ViewType, id: string) {
  return `/api/${type === "post" ? "posts" : "recipes"}/${id}/view`;
}

export default function ViewCount({ type, id, initialCount, dedupeMs = 300 }: ViewCountProps) {
  const [count, setCount] = React.useState<number>(initialCount);

  React.useEffect(() => {
    if (!id) return;

    const storageKey = `view-hit:${type}:${id}`;
    const now = Date.now();

    try {
      const raw = sessionStorage.getItem(storageKey);
      const previous = raw ? Number(raw) : 0;
      if (Number.isFinite(previous) && previous > 0 && now - previous < dedupeMs) {
        return;
      }
      sessionStorage.setItem(storageKey, String(now));
    } catch {}

    const url = buildUrl(type, id);

    (async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          cache: "no-store",
          keepalive: true,
        });
        if (!res.ok) return;

        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const json = await res.json();
          const next = Number(json?.viewCount);
          if (Number.isFinite(next)) {
            setCount(next);
            return;
          }
        }

        setCount((prev) => prev + 1);
      } catch {}
    })();
  }, [type, id, dedupeMs]);

  return <span>{count}</span>;
}

