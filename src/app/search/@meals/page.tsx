import { fetchRecipes } from "@/data/recipe"; 
export const revalidate = 0;

export default async function MealsResults({
  searchParams,
}: {
  searchParams: { query?: string | string[] };
}) {
  const raw = searchParams?.query ?? "";
  const q = Array.isArray(raw) ? raw[0] : raw;
  const keyword = q.trim().toLowerCase();

  const all = await fetchRecipes();
  const results = all.filter(r => {
    const hay = `${r.title ?? ""} ${r.name ?? ""} ${r.summary ?? ""}`.toLowerCase();
    return keyword ? hay.includes(keyword) : true;
  });

  return (
    <section>
      <h2>레시피</h2>
      <ul>
        {results.map(r => (
          <li key={r.id}>
            <a href={`/meals/${r.id}`}>{r.title} <small>by {r.name}</small></a>
          </li>
        ))}
      </ul>
    </section>
  );
}