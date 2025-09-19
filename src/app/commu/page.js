"use client";

import { useEffect, useState } from "react";

import BoardMain from "@/component/postboard/postboard";
import LoadingPage from "../loading";
import { listPosts } from "@/features/post/api";

export default function CommuPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const data = await listPosts({ limit: 100 });
        const items = Array.isArray(data?.items) ? [...data.items] : [];
        if (cancelled) return;

        items.sort((a, b) => (a?.number ?? 0) - (b?.number ?? 0));
        setPosts(items);
      } catch (error) {
        console.error("Failed to load posts", error);
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  return <BoardMain data={posts} />;
}
