import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import { PaginationComponent } from "@/components/pagenation/pagenation";
import { listComments } from "@/domain/comment/service";
import { CommentDisplayItem } from "@/domain/comment/types";
import CommentThread from "@/domain/comment/ui/CommentThread.client";
import { getRecipeById } from "@/domain/recipe/service";
import RecipeDetail from "@/domain/recipe/ui/RecipeDetail";
import RecipeIngredientsPanel from "@/domain/recipe/ui/RecipeIngredientsPanel";
import { isBookmarkedRecipe } from "@/domain/user/user_bookmark/repository";
import BookmarkBtn from "@/domain/user/user_bookmark/ui/bookmarkbtn";
import { getServerSupabase } from "@/lib/supabase/server";
import DeleteRecipeButton from "../_components/DeleteRecipeButton";

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
  const recipe = await getRecipeById(supabase, params.id);
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id && recipe.writerUid ? user.id === recipe.writerUid : false;
  const initialBookmarked = user?.id
    ? await isBookmarkedRecipe(supabase, user.id, recipe.id)
    : false;

  return (
    <main className="pt-[100px] pb-[100px]">
      <div className="mx-auto max-w-screen-2xl px-4">
        {/* 모바일: 1열 / 데스크톱: 4열 */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          {/* 왼쪽 사이드 */}
          <aside className="order-3 min-w-0 space-y-4 lg:order-none lg:col-span-1 lg:self-start lg:sticky lg:top-24">
            <div className="flex justify-end">
              <BookmarkBtn recipeId={recipe.id} marked={initialBookmarked} count={0} />
            </div>
            {isAuthor ? (
              <div className="flex justify-end">
                <DeleteRecipeButton recipeId={recipe.id} />
              </div>
            ) : null}
          </aside>

          {/* 중앙 본문 */}
          <div className="order-1 min-w-0 space-y-8 lg:order-none lg:col-span-2">
            <RecipeDetail recipe={recipe} />

            <section className="space-y-4 border-t border-border/60 pt-8">
              <CommentThread
                parentType="recipe"
                parentId={recipe.id}
                pageSize={commentLimit}
                items={displayItems}
              />

              <PaginationComponent
                basePath={`/recipes/${params.id}`}
                page={currentPage}
                pageSize={commentLimit}
                total={total}
                pageParam="commentPage"
              />
            </section>
          </div>

          {/* 오른쪽 사이드 */}
          <aside className="order-2 min-w-0 space-y-4 lg:order-none lg:col-span-1 lg:self-start lg:sticky lg:top-24">
            <RecipeIngredientsPanel ingredients={recipe.ingredients} />
          </aside>
        </div>
      </div>
    </main>
  );
}
