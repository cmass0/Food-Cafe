import { fetchPosts } from "@/data/post";
export const revalidate = 0;

export default async function PostResults({
  searchParams,
}: {
  searchParams: { query?: string | string[] };
}) {
  const raw = searchParams?.query ?? "";
  const q: string = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const keyword = q.trim().toLowerCase();

  const all = await fetchPosts();
  const results = all.filter((p) => {
    const hay = `${p.title ?? ""} ${p.writer ?? ""}`.toLowerCase();
    return keyword ? hay.includes(keyword) : true;
  });

  return (
    <section>
      <h2>커뮤니티</h2>
      <ul>
        {results.map((p) => (
          <li key={p.id}>
            <a href={`/commu/${p.id}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
