import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import CommentArea from "@/domain/comment/ui/CommentArea";
import { getRecipeById } from "@/domain/recipe/service";
import RecipeDetail from "@/domain/recipe/ui/RecipeDetail";
import ViewHit from "@/domain/view/ui/ViewHit.client";
import { getServerSupabase } from "@/lib/supabase/server";

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

  const commentLimit = 5;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id && recipe.writerUid ? user.id === recipe.writerUid : false;

  return (
    <main className="relative pt-24 pb-24">
      {/* 본문*/}
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-col gap-10 xl:grid ">
          <div className="xl:col-start-1">
            <ViewHit type="recipe" id={recipe.id} />
            <RecipeDetail recipe={recipe} isAuthor={isAuthor} />
          </div>

          <div className="xl:col-start-1 xl:row-start-2">
            <CommentArea
              parentType="recipe"
              parentId={recipe.id}
              basePath={`/recipes/${params.id}`}
              searchParams={searchParams}
              limit={commentLimit}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
