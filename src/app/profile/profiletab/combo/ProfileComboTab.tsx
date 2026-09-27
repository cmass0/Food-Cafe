import Section from "@/components/status/Section";
import { listBookmarkedCombos, listLikedCombos, listCombos } from "@/domain/combo/service";
import type { ComboListResult } from "@/domain/combo/types";
import { loadSection } from "@/lib/errors/section";
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
  const result = await loadSection<ComboListResult>(
    "profile.combos",
    () => {
      if (type === "written")
        return listCombos(supabase, { ...options, writerUid: currentUid, sort });
      if (type === "bookmark") return listBookmarkedCombos(supabase, currentUid, options);
      return listLikedCombos(supabase, currentUid, options);
    },
    { items: [], total: 0, limit: safeLimit, offset: (currentPage - 1) * safeLimit, hasMore: false }
  );

  return (
    <Section
      name="profile.combos"
      failed={result.error}
      outOfRange={result.outOfRange}
      title="조합을 불러오지 못했습니다."
      resetKeys={[currentUid, type, currentPage, safeLimit, trimmedSearch, sort, view]}
    >
      <ProfileComboGrid combos={result.data.items} view={view} />
      <ProfileComboPagination
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
