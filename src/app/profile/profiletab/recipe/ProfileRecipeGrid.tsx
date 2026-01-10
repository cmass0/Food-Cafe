import { Eye, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { normaliseTextArray } from "@/domain/recipe/service";
import type { Recipe } from "@/domain/recipe/types";

type Props = {
  recipes: Recipe[];
};

export default function ProfileRecipeGrid({ recipes }: Props) {
  if (recipes.length === 0) {
    return (
      <div className="text-sm text-gray-500 font-semibold flex justify-center items-center">
        컨텐츠가 존재하지않습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {recipes.map((recipe) => (
        <Card
          key={recipe.id}
          className="overflow-hidden border border-border/70 bg-white shadow-sm transition hover:shadow-md"
        >
          <CardContent className="flex gap-4 p-4">
            <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-md bg-slate-100">
              {recipe.image ? (
                <Image
                  src={recipe.image}
                  alt={recipe.title || "레시피 이미지"}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                  IMG
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Link
                href={`/recipes/${recipe.id}`}
                className="block text-base font-semibold text-slate-900"
              >
                {recipe.title || "제목 없음"}
              </Link>
              {recipe.summary ? (
                <p className="line-clamp-2 text-sm text-slate-600">{recipe.summary}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {recipe.category ? <Badge variant="outline">{recipe.category}</Badge> : null}
                {normaliseTextArray(recipe.tags)
                  .slice(0, 3)
                  .map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4 fill-pink-300/100 text-emerald-50" />
                  <span>{recipe.likeCount ?? 0}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-gray-950" />
                  <span>{recipe.viewCount ?? 0}</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
