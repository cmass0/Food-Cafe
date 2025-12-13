"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type ViewHitType = "post" | "recipe";

type ViewHitProps = {
  type: ViewHitType;
  id: string;
  dedupeMs?: number;
  refreshAfterHit?: boolean;
};

function buildUrl(type: ViewHitType, id: string) {
  return `/api/${type === "post" ? "posts" : "recipes"}/${id}/view`;
}

export default function ViewHit({
  type,
  id,
  dedupeMs = 300,
  refreshAfterHit = true,
}: ViewHitProps) {
  const router = useRouter();
  const lastHitRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    const signature = `${type}:${id}`;
    if (lastHitRef.current === signature) return;
    lastHitRef.current = signature;

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
        if (refreshAfterHit) router.refresh();
      } catch {
        // ignore
      }
    })();
  }, [type, id, dedupeMs, refreshAfterHit, router]);

  return null;
}
