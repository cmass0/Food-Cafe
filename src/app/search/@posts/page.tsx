import Link from "next/link";

import { listPosts } from "@/domain/post/service";
import { getServerSupabase } from "@/lib/supabase/server";

export const revalidate = 0;

type SP = { query?: string | string[] };

export default async function PostResults({ searchParams }: { searchParams: SP }) {
  const raw = searchParams?.query;
  const q: string = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const keyword = q.trim();
  const limit = 10;

  const supabase = getServerSupabase();
  const { items } = await listPosts(supabase, {
    limit,
    search: keyword.length > 0 ? keyword : undefined,
  });

  if (items.length === 0) return <p>검색 결과가 없습니다.</p>;

  return (
    <ul>
      {items.map((p: any) => (
        <li key={p.id} style={{ padding: "6px 0" }}>
          <Link href={`/posts/${p.id}`}>{p.title}</Link>
        </li>
      ))}
    </ul>
  );
}
