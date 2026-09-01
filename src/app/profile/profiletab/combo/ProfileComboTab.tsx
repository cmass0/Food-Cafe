import SectionErrorState from "@/components/status/SectionErrorState";
import { listBookmarkedCombos, listCombos, listLikedCombos } from "@/domain/combo/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import ProfileComboGrid from "./ProfileComboGrid";
import ProfileComboPagination from "./ProfileComboPagination";
import type { ProfileSort, ProfileView } from "../../profile-types";

export type ProfileComboType = "written" | "bookmark" | "like";

type Props = {
  type: ProfileComboType;
  page?: number;
  limit?: number;
  search?: string;
  sort?: ProfileSort;
  view?: ProfileView;
  id?: string;
};

export default async function ProfileComboTab({
  type,
  page = 1,
  limit = 6,
  search,
  sort = "recent",
  view = "grid",
  id,
}: Props) {
  const currentUid = id ?? null;
  if (!currentUid) {
    return notFound();
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && type !== "written") {
    return <div className="text-sm text-slate-600">로그인이 필요합니다.</div>;
  }

  const currentPage = Math.max(1, Math.trunc(page));
  const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
  const trimmedSearch = search?.trim() || undefined;

  try {
    if (type === "written") {
      const result = await listCombos(supabase, {
        writerUid: currentUid,
        page: currentPage,
        limit: safeLimit,
        search: trimmedSearch,
        sort,
      });
      return (
        <>
          <ProfileComboGrid combos={result.items} view={view} />
          <ProfileComboPagination
            type={type}
            page={currentPage}
            limit={safeLimit}
            total={result.total}
            search={trimmedSearch}
            sort={sort}
            view={view}
          />
        </>
      );
    }

    if (type === "bookmark") {
      const result = await listBookmarkedCombos(supabase, currentUid, {
        page: currentPage,
        limit: safeLimit,
        search: trimmedSearch,
      });

      return (
        <>
          <ProfileComboGrid combos={result.items} view={view} />
          <ProfileComboPagination
            type={type}
            page={currentPage}
            limit={safeLimit}
            total={result.total}
            search={trimmedSearch}
            sort={sort}
            view={view}
          />
        </>
      );
    }

    if (type === "like") {
      const result = await listLikedCombos(supabase, currentUid, {
        page: currentPage,
        limit: safeLimit,
        search: trimmedSearch,
      });
      return (
        <>
          <ProfileComboGrid combos={result.items} view={view} />
          <ProfileComboPagination
            type={type}
            page={currentPage}
            limit={safeLimit}
            total={result.total}
            search={trimmedSearch}
            sort={sort}
            view={view}
          />
        </>
      );
    }
  } catch (error) {
    console.error("[profile.combo.tab] fetch error:", error);
    return <SectionErrorState title="조합을 불러오지 못했습니다." />;
  }
}
