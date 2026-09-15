"use client";

import { useEffect, useRef, useState } from "react";

type ViewType = "post" | "recipe" | "combo";

type ViewCountProps = {
  type: ViewType;
  id: string;
  initialCount: number;
};

const VIEW_PATHS: Record<ViewType, string> = {
  post: "posts",
  recipe: "recipes",
  combo: "combos",
};

export default function ViewCount({ type, id, initialCount }: ViewCountProps) {
  const [count, setCount] = useState(initialCount);
  const lastHitRef = useRef<string | null>(null);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount, id, type]);

  useEffect(() => {
    if (!id) return;
    const signature = `${type}:${id}`;
    if (lastHitRef.current === signature) return;
    lastHitRef.current = signature;

    (async () => {
      try {
        const res = await fetch(`/api/${VIEW_PATHS[type]}/${id}/view`, {
          method: "POST",
          cache: "no-store",
          keepalive: true,
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (data && typeof data.viewCount === "number") {
          setCount(data.viewCount);
          return;
        }
        setCount((prev) => prev + 1);
      } catch {
        // ignore
      }
    })();
  }, [id, type]);

  return <span>{count}</span>;
}
