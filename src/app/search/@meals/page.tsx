import Link from "next/link";
import { fetchRecipes } from "@/data/recipe";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type SP = { query?: string | string[] };

export default async function MealsResults({ searchParams }: { searchParams: SP }) {
  const raw = searchParams?.query;
  const q = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const keyword = q.trim().toLowerCase();

  const all = await fetchRecipes();
  const results = all.filter((r: any) => {
    const hay = `${r.title ?? ""} ${r.name ?? ""} ${r.summary ?? ""}`.toLowerCase();
    return keyword ? hay.includes(keyword) : true;
  });

  if (results.length === 0) return <p>검색 결과가 없습니다.</p>;

  return (
    <ul>
      {results.map((r: any) => (
        <li key={r.id} style={{ padding: "6px 0" }}>
          <Link href={`/meals/${r.id}`}>{r.title}</Link>{" "}
          <small style={{ opacity: 0.7 }}>by {r.name ?? "작성자"}</small>
        </li>
      ))}
    </ul>
  );
}