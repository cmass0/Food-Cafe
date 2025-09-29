import Link from "next/link";

import { Card, CardBody, CardFooter, Image } from "@heroui/react";
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
    <div
      style={{
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      }}
    >
      {results.map((r: any) => (
        <Card
          as={Link}
          href={`/meals/${r.id}`}
          isPressable
          key={r.id}
          shadow="sm"
        >
          {r.image && (
            <Image
              alt={r.title}
              height={140}
              src={r.image}
              width="100%"
              style={{ objectFit: "cover" }}
              removeWrapper
            />
          )}
          <CardBody>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600 }}>
              {r.title}
            </h3>
            {r.summary && (
              <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
                {r.summary}
              </p>
            )}
          </CardBody>
          <CardFooter>
            <small style={{ color: "#666" }}>
              by {r.name ?? "작성자"}
            </small>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
