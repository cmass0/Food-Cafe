import { listBookmarkedCombos, listCombos, listLikedCombos } from "@/domain/combo/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import ProfileComboGrid from "./ProfileComboGrid";
import ProfileComboPagination from "./ProfileComboPagination";

export type ProfileComboType = "written" | "bookmark" | "like";

type Props = {
  type: ProfileComboType;
  page?: number;
  limit?: number;
  search?: string;
  id?: string;
};

export default async function ProfileComboTab({ type, page = 1, limit = 6, search, id }: Props) {
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
      });
      return (
        <>
          <ProfileComboGrid combos={result.items} />
          <ProfileComboPagination
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
      const result = await listBookmarkedCombos(supabase, currentUid, {
        page: currentPage,
        limit: safeLimit,
        search: trimmedSearch,
      });

      return (
        <>
          <ProfileComboGrid combos={result.items} />
          <ProfileComboPagination
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
      const result = await listLikedCombos(supabase, currentUid, {
        page: currentPage,
        limit: safeLimit,
        search: trimmedSearch,
      });
      return (
        <>
          <ProfileComboGrid combos={result.items} />
          <ProfileComboPagination
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
    console.error("[profile.combo.tab] fetch error:", error);
    return <div className="text-sm text-destructive">조합을 불러오지 못했습니다.</div>;
  }
}
