import Link from "next/link";

import Image from "next/image";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import LikeButton from "@/domain/recipe/recipe_like/ui/likebutton";
import { listRecipes } from "@/domain/recipe/service";
import { Recipe } from "@/domain/recipe/types";
import { getServerSupabase } from "@/lib/supabase/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type SP = { query?: string | string[] };

export default async function MealsResults({ searchParams }: { searchParams: SP }) {
  const raw = searchParams?.query;
  const q = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const keyword = q.trim().toLowerCase();

  const all = (await listRecipes(getServerSupabase(), { limit: 200 })).items;
  const results = all.filter((r: any) => {
    const hay = `${r.title ?? ""} ${r.writerName ?? ""} ${r.summary ?? ""}`.toLowerCase();
    return keyword ? hay.includes(keyword) : true;
  });

  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((r: Recipe) => (
        <Card key={r.id} className="overflow-hidden">
          <Link href={`/recipes/${r.id}`} className="block">
            {r.image ? (
              <div className="relative h-36 w-full">
                <Image
                  alt={r.title ?? "recipe"}
                  src={r.image}
                  fill
                  sizes="(max-width: 1024px) 100vw, 220px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <CardContent className="space-y-1">
              <h3 className="text-base font-semibold">{r.title}</h3>
              {r.summary ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">{r.summary}</p>
              ) : null}
            </CardContent>
          </Link>
          <CardFooter className="flex items-center justify-between gap-3">
            <small className="text-xs text-muted-foreground">by {r.writerName ?? "user"}</small>
            <LikeButton
              recipeId={r.id}
              liked={false}
              count={r.likeCount ?? 0}
              onChange={() => {}}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
