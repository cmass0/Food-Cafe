"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PostViewIncrementProps = {
  id: string;
  initialCount: number;
};

export default function PostViewIncrement({ id, initialCount }: PostViewIncrementProps) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const triggered = useRef(false);

  useEffect(() => {
    setCount(initialCount);
    triggered.current = false;
  }, [id, initialCount]);

  useEffect(() => {
    if (!id || triggered.current) {
      return;
    }
    triggered.current = true;

    const controller = new AbortController();

    const bumpView = async () => {
      setCount((prev) => prev + 1);

      try {
        const response = await fetch(`/api/posts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkIncrement: true }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("increment failed");
        }

        router.refresh();
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setCount(initialCount);
        triggered.current = false;
      }
    };

    void bumpView();

    return () => {
      controller.abort();
    };
  }, [id, initialCount, router]);

  return <span>Views {count}</span>;
}
