import { listBookmarkedRecipes, listLikedRecipes, listRecipes } from "@/features/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";

import ProfileRecipeGrid from "./ProfileRecipeGrid";
import ProfilePagination from "./Profilepagenation";

export type ProfileRecipeType = "written" | "bookmark" | "like";

type Props = {
  type: ProfileRecipeType;
  page?: number;
  limit?: number;
  search?: string;
  id?: string;
};

const EMPTY_MESSAGES: Record<ProfileRecipeType, string> = {
  written: "작성한 레시피가 없습니다.",
  bookmark: "북마크한 레시피가 없습니다.",
  like: "좋아요한 레시피가 없습니다.",
};

export default async function ProfileRecipeTab({ type, page = 1, limit = 6, search, id }: Props) {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="text-sm text-slate-600">로그인이 필요합니다.</div>;
  }

  const currentPage = Math.max(1, Math.trunc(page));
  const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
  const trimmedSearch = search?.trim() || undefined;
  const currentUid = id ? id : user.id;

  try {
    if (type === "written") {
      const result = await listRecipes(supabase, {
        writerUid: currentUid,
        page: currentPage,
        limit: safeLimit,
        search: trimmedSearch,
      });
      return (
        <>
          <ProfileRecipeGrid recipes={result.items} emptyMessage={EMPTY_MESSAGES[type]} />
          <ProfilePagination
            type={type}
            page={currentPage}
            limit={safeLimit}
            total={result.total}
            search={trimmedSearch}
          />
        </>
      );
    }

    if (type === "bookmark") {
      const result = await listBookmarkedRecipes(supabase, currentUid, {
        page: currentPage,
        limit: safeLimit,
        search: trimmedSearch,
      });

      return (
        <>
          <ProfileRecipeGrid recipes={result.items} emptyMessage={EMPTY_MESSAGES[type]} />
          <ProfilePagination
            type={type}
            page={currentPage}
            limit={safeLimit}
            total={result.total}
            search={trimmedSearch}
          />
        </>
      );
    }

    if (type === "like") {
      const result = await listLikedRecipes(supabase, currentUid, {
        page: currentPage,
        limit: safeLimit,
        search: trimmedSearch,
      });
      return (
        <>
          <ProfileRecipeGrid recipes={result.items} emptyMessage={EMPTY_MESSAGES[type]} />
          <ProfilePagination
            type={type}
            page={currentPage}
            limit={safeLimit}
            total={result.total}
            search={trimmedSearch}
          />
        </>
      );
    }
  } catch (error) {
    console.error("[profile.tab] fetch error:", error);
    return <div className="text-sm text-destructive">레시피를 불러오지 못했습니다.</div>;
  }
}
