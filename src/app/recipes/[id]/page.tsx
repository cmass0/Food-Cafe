import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import DeleteRecipeButton from "../_components/DeleteRecipeButton";
import { getServerSupabase } from "@/lib/supabase/server";
import { getRecipe } from "@/features/recipe/service";
import RecipeDetail from "@/features/recipe/ui/RecipeDetail";
import CommentThread from "@/features/comment/ui/CommentThread.client";

import { PaginationComponent } from "@/components/pagenation/pagenation";
import { listComments } from "@/features/comment/service";
import { CommentDisplayItem } from "@/features/comment/types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function RecipeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  noStore();
  const supabase = getServerSupabase();
  const recipe = await getRecipe(supabase, params.id);
  if (!recipe) notFound();

  const pageValue = searchParams?.commentPage ?? searchParams?.commentpage;
  const pageNumber = Number(pageValue);
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const commentLimit = 5;
  const { items, total } = await listComments(supabase, {
    parentType: "recipe",
    parentId: recipe.id,
    page: currentPage,
    limit: commentLimit,
  });

  const displayItems: CommentDisplayItem[] = items.map((c) => ({
    id: c.id,
    writerName: c.writerName,
    writerUid: c.writerUid,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <RecipeDetail recipe={recipe} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold"></h2>
          <DeleteRecipeButton recipeId={recipe.id} />
        </div>
      </section>

      <section className="h-px w-full bg-border">
        <CommentThread
          parentType="recipe"
          parentId={recipe.id}
          pageSize={commentLimit}
          items={displayItems}
        ></CommentThread>

        <PaginationComponent
          basePath={`/recipes/${params.id}`}
          page={currentPage}
          pageSize={commentLimit}
          total={total}
          pageParam="commentPage"
        />
      </section>
    </main>
  );
}
