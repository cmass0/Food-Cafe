import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import CommentArea from "@/domain/comment/ui/CommentArea";
import { getRecipeById } from "@/domain/recipe/service";
import RecipeDetail from "@/domain/recipe/ui/RecipeDetail";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function RecipeDetailPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  noStore();
  const supabase = await getServerSupabase();
  const recipe = await getRecipeById(supabase, params.id);
  if (!recipe) notFound();

  const commentLimit = 5;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id && recipe.writerUid ? user.id === recipe.writerUid : false;

  return (
    <main className="bg-white pb-20 pt-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 lg:px-8">
        <RecipeDetail recipe={recipe} isAuthor={isAuthor} />

        <CommentArea
          parentType="recipe"
          parentId={recipe.id}
          basePath={`/recipes/${params.id}`}
          searchParams={searchParams}
          limit={commentLimit}
          showTitle
          className="border-t-0 pt-0"
        />
      </div>
    </main>
  );
}
