"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

type ViewHitType = "post" | "recipe" | "combo";

type ViewHitProps = {
  type: ViewHitType;
  id: string;
  refreshAfterHit?: boolean;
};

function buildUrl(type: ViewHitType, id: string) {
  if (type === "post") return `/api/posts/${id}/view`;
  if (type === "recipe") return `/api/recipes/${id}/view`;
  return `/api/combos/${id}/view`;
}

export default function ViewHit({
  type,
  id,
  refreshAfterHit = true,
}: ViewHitProps) {
  const router = useRouter();
  const lastHitRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    const signature = `${type}:${id}`;
    if (lastHitRef.current === signature) return;
    lastHitRef.current = signature;

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
      } catch {}
    })();
  }, [type, id, refreshAfterHit, router]);

  return null;
}
