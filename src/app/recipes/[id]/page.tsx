import { notFound } from "next/navigation";

import DeleteRecipeButton from "../_components/DeleteRecipeButton";
import RecipeDetail from "@/features/recipe/ui/RecipeDetail";
import type { Recipe } from "@/features/recipe/types";

type RecipeDetailPageProps = {
  params: { id: string };
};

function mapRecipeFromApi(payload: any): Recipe {
  return {
    id: payload.id,
    title: payload.title,
    summary: payload.summary ?? null,
    recipe: payload.recipe ?? null,
    image: payload.image ?? null,
    category: payload.category ?? null,
    tags: payload.tags ?? [],
    likeCount: payload.likeCount ?? payload.like_count ?? 0,
    viewCount: payload.viewCount ?? payload.view_count ?? 0,
    writerUid: payload.writerUid ?? payload.writer_uid ?? null,
    writerName: payload.writerName ?? payload.writer_name ?? null,
    writerEmail: payload.writerEmail ?? payload.writer_email ?? null,
    lastLikedAt: payload.lastLikedAt ?? payload.last_liked_at ?? null,
    createdAt: new Date(payload.createdAt ?? payload.created_at),
    updatedAt: new Date(payload.updatedAt ?? payload.updated_at),
  };
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const apiBase = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const response = await fetch(`${apiBase}/api/recipes/${params.id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error("Failed to load recipe");
  }

  const { data } = await response.json();
  const recipe = mapRecipeFromApi(data);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <RecipeDetail recipe={recipe} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold"></h2>
          <DeleteRecipeButton recipeId={recipe.id} />
        </div>
        {/* <RecipeEditForm recipe={recipe} /> */}
      </section>
    </main>
  );
}
