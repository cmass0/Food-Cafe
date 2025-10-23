"use client";

import { useEffect, useRef } from "react";

type PostViewIncrementProps = {
  id: string;
};

export default function PostViewIncrement({ id }: PostViewIncrementProps) {
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIncrement: true }),
    }).catch(() => {});
  }, [id]);

  return null;
}
