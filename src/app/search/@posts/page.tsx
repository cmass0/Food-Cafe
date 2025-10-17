import Link from "next/link";

import { getServerSupabase } from "@/lib/supabase/server";
import { listPosts } from "@/features/post/service";

export const revalidate = 0;

type SP = { query?: string | string[] };

export default async function PostResults({ searchParams }: { searchParams: SP }) {
  const raw = searchParams?.query;
  const q: string = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const keyword = q.trim().toLowerCase();

  const supabase = getServerSupabase();
  const { items: all } = await listPosts(supabase, { limit: 200 });
  const results = all.filter((p: any) => {
    const hay = `${p.title ?? ""} ${p.writerName ?? ""}`.toLowerCase();
    return keyword ? hay.includes(keyword) : true;
  });

  if (results.length === 0) return <p>검색 결과가 없습니다.</p>;

  return (
    <ul>
      {results.map((p: any) => (
        <li key={p.id} style={{ padding: "6px 0" }}>
          <Link href={`/posts/${p.id}`}>{p.title}</Link>
        </li>
      ))}
    </ul>
  );
}
