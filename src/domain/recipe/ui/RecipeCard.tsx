import { Eye, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import AuthorProfileMenu from "@/components/user/AuthorProfileMenu";
import BookmarkBtn from "@/domain/recipe/recipe_bookmark/ui/bookmarkbtn";
import LikeButton from "@/domain/recipe/recipe_like/ui/likebutton";
import { useState } from "react";
import type { Recipe } from "../types";

type RecipeCardProps = {
  recipe: Recipe;
  initialLiked: boolean;
  initialCount: number;
  initialBookmarked: boolean;
};

export default function RecipeCard({
  initialLiked,
  initialCount,
  initialBookmarked,
  recipe,
}: RecipeCardProps) {
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [likeCount, setLikeCount] = useState<number>(initialCount ?? recipe.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState<boolean>(initialBookmarked);

  const createdLabel = recipe.createdAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  async function LikeButtonHD(likedState: { liked: boolean; likeCount?: number | null }) {
    setLiked(likedState.liked);

    if (typeof likedState.likeCount === "number") {
      setLikeCount(likedState.likeCount);
    }
  }

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-none border border-border bg-gradient-to-b from-emerald-900/85 via-emerald-900/70 to-emerald-950/95 text-emerald-50 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-56 w-full overflow-hidden">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title || "레시피 이미지"}
            fill
            priority={false}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-emerald-950/80 text-sm text-emerald-200/70">
            이미지가 준비되지 않았어요
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

        <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-base font-semibold tracking-tight text-emerald-50">
              {recipe.title}
            </h3>
            <p className="line-clamp-1 text-[11px] text-emerald-100/80">
              by{" "}
              <AuthorProfileMenu
                name={recipe.writerName ?? "무명 셰프"}
                userId={recipe.writerUid}
              />{" "}
              · {createdLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkBtn
              recipeId={recipe.id}
              marked={bookmarked}
              count={0}
              onChange={({ bookmarked }) => setBookmarked(bookmarked)}
            />
            <LikeButton
              recipeId={recipe.id}
              liked={liked}
              count={likeCount}
              onChange={LikeButtonHD}
            />
          </div>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-5 pb-2 min-h-[100px]">
        <p className="line-clamp-5 text-sm leading-relaxed text-emerald-50/90">
          {recipe.summary || "설명이 준비되지 않았어요"}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-[11px] text-emerald-100/85">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3 w-3 fill-emerald-300/80 text-emerald-50" />
              <span>{likeCount}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-emerald-100" />
              <span>{recipe.viewCount ?? 0}</span>
            </span>
          </div>

          <Button
            asChild
            size="sm"
            className="h-8 rounded-full bg-emerald-400 px-4 text-[11px] font-medium text-emerald-950 shadow-sm hover:bg-emerald-300"
          >
            <Link href={`/recipes/${recipe.id}`} prefetch={false}>
              레시피 보기
            </Link>
          </Button>
        </div>

        <div className="flex w-full flex-wrap justify-start gap-2 text-[11px] text-emerald-100/80">
          {recipe.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-emerald-400/30 bg-emerald-900/40 px-3 py-1"
            >
              #{tag}
            </span>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
