import { fetchPosts } from "@/data/post";
import { fetchcommets } from "@/data/comment";

export const revalidate = 0;

type SP = { query?: string | string[] };

export default async function PostResults({ searchParams }: { searchParams: SP }) {
  const raw = searchParams?.query;
  const q: string = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const keyword = q.trim().toLowerCase();

  const [all, comments] = await Promise.all([fetchPosts(), fetchcommets()]);

  const commentCounts = comments.reduce<Record<string, number>>((acc, c: any) => {
    if (c?.type) acc[c.type] = (acc[c.type] ?? 0) + 1;
    return acc;
  }, {});

  const results = all.filter((p: any) => {
    const hay = `${p.title ?? ""} ${p.writer ?? ""}`.toLowerCase();
    return keyword ? hay.includes(keyword) : true;
  });

  if (results.length === 0) return <p>검색 결과가 없습니다.</p>;

  return (
    <section aria-label="게시글 검색 결과">
      {results.map((p: any) => (
        <a
          key={p.id}
          href={`/commu/${p.id}`}
          style={{
            display: "block",
            padding: "12px 14px",
            border: "1px solid #eee",
            borderRadius: 8,
            marginBottom: 10,
            textDecoration: "none",
          }}
        >
          <div style={{ fontWeight: 600, color: "inherit" }}>{p.title ?? "제목 없음"}</div>
          <small style={{ color: "#666" }}>
            {p.writer ?? "작성자"} · 댓글 {commentCounts[p.id] ?? 0}
          </small>
        </a>
      ))}
    </section>
  );
}
