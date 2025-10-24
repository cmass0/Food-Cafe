"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type PostViewIncrementProps = {
  id: string;
};

export default function PostViewIncrement({ id }: PostViewIncrementProps) {
  const router = useRouter();
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (hasIncremented.current) return;
    hasIncremented.current = true;

    fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIncrement: true }),
    })
      .then(() => {
        router.refresh();
      })
      .catch(() => {});
  }, [id, router]);

  return null;
}