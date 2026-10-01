import Section from "@/components/status/Section";
import { listBookmarkedRecipes, listLikedRecipes, listRecipes } from "@/domain/recipe/service";
import type { RecipeListResult } from "@/domain/recipe/types";
import { loadMyReactions, withMyReactions } from "@/features/my-reactions/service";
import { loadSection } from "@/lib/errors/section";
import { getServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import ProfileRecipeGrid from "./ProfileRecipeGrid";
import ProfileRecipePagination from "./ProfileRecipepagenation";
import type { ProfileSort, ProfileView } from "../../profile-types";

export type ProfileRecipeType = "written" | "bookmark" | "like";

type Props = {
  type: ProfileRecipeType;
  page?: number;
  limit?: number;
  search?: string;
  sort?: ProfileSort;
  view?: ProfileView;
  id?: string;
};

export default async function ProfileRecipeTab({
  type,
  page = 1,
  limit = 6,
  search,
  sort = "recent",
  view = "grid",
  id,
}: Props) {
  const currentUid = id ?? null;
  if (!currentUid) return notFound();

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // 인증·404 판단은 선택적 콘텐츠 조회의 오류로 바꾸지 않는다.
  if (!user && type !== "written") {
    return <div className="text-sm text-slate-600">로그인이 필요합니다.</div>;
  }

  const currentPage = Math.max(1, Math.trunc(page));
  const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
  const trimmedSearch = search?.trim() || undefined;
  const options = { page: currentPage, limit: safeLimit, search: trimmedSearch };
  const result = await loadSection<RecipeListResult>(
    "profile.recipes",
    () => {
      if (type === "written")
        return listRecipes(supabase, { ...options, writerUid: currentUid, sort });
      if (type === "bookmark") return listBookmarkedRecipes(supabase, currentUid, options);
      return listLikedRecipes(supabase, currentUid, options);
    },
    { items: [], total: 0, limit: safeLimit, offset: (currentPage - 1) * safeLimit, hasMore: false }
  );

  // 내가 누른 좋아요는 카드 아이콘을 채워 표시한다.
  const reactions = await loadMyReactions(
    supabase,
    result.data.items.map(({ id }) => ({ type: "recipe", id })),
    user?.id ?? null
  );

  return (
    <Section
      name="profile.recipes"
      failed={result.error}
      outOfRange={result.outOfRange}
      title="레시피를 불러오지 못했습니다."
      resetKeys={[currentUid, type, currentPage, safeLimit, trimmedSearch, sort, view]}
    >
      <ProfileRecipeGrid
        recipes={withMyReactions(result.data.items, "recipe", reactions)}
        view={view}
      />
      <ProfileRecipePagination
        type={type}
        page={currentPage}
        limit={safeLimit}
        total={result.data.total}
        search={trimmedSearch}
        sort={sort}
        view={view}
      />
    </Section>
  );
}
