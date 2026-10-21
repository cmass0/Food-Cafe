import Section from "@/components/status/Section";
import { listBookmarkedPosts, listLikedPosts, listPosts } from "@/domain/post/service";
import type { PostListOptions, PostListResult } from "@/domain/post/types";
import { loadMyReactions, withMyReactions } from "@/features/my-reactions/service";
import { loadSection } from "@/lib/errors/section";
import { getServerSupabase } from "@/lib/supabase/server";

import type { ProfileSort, ProfileView } from "../../profile-types";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfilePostPagination from "./ProfilePostPagination";

export type ProfilePostType = "written" | "bookmark" | "like";

type Props = {
  type: ProfilePostType;
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: ProfileSort;
  view?: ProfileView;
};

export default async function ProfilePostTab({
  type,
  userId,
  page = 1,
  limit = 6,
  search,
  sort = "recent",
  view = "grid",
}: Props) {
  const currentPage = Math.max(1, Math.trunc(page));
  const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
  const trimmedSearch = search?.trim() || undefined;
  const serviceSort: NonNullable<PostListOptions["sort"]> =
    sort === "like" ? "likes" : sort === "view" ? "views" : "recent";
  const options: PostListOptions = {
    page: currentPage,
    limit: safeLimit,
    search: trimmedSearch,
    searchField: "title" as const,
    sort: serviceSort,
  };

  const supabase = await getServerSupabase();
  const result = await loadSection<PostListResult>(
    "profile.posts",
    async () => {
      return type === "written"
        ? await listPosts(supabase, { ...options, writerUid: userId })
        : type === "bookmark"
          ? await listBookmarkedPosts(supabase, userId, options)
          : await listLikedPosts(supabase, userId, options);
    },
    { items: [], total: 0, limit: safeLimit, offset: (currentPage - 1) * safeLimit, hasMore: false }
  );

  // 내가 누른 좋아요·북마크는 카드 아이콘을 채워 표시한다.
  // 게시글 활동은 마이페이지 전용이라 목록 주인이 곧 보는 사람이다.
  const reactions = await loadMyReactions(
    supabase,
    result.data.items.map(({ id }) => ({ type: "post", id })),
    userId
  );

  return (
    <Section
      name="profile.posts"
      failed={result.error}
      outOfRange={result.outOfRange}
      title="게시글을 불러오지 못했습니다."
      resetKeys={[userId, type, currentPage, safeLimit, trimmedSearch, sort, view]}
    >
      <ProfilePostGrid posts={withMyReactions(result.data.items, "post", reactions)} view={view} />
      <ProfilePostPagination
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
