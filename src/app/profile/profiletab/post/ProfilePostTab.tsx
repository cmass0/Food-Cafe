import SectionErrorState from "@/components/status/SectionErrorState";
import {
  listBookmarkedPosts,
  listLikedPosts,
  listPosts,
} from "@/domain/post/service";
import type { PostListOptions } from "@/domain/post/types";
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

  try {
    const supabase = await getServerSupabase();
    const result =
      type === "written"
        ? await listPosts(supabase, { ...options, writerUid: userId })
        : type === "bookmark"
          ? await listBookmarkedPosts(supabase, userId, options)
          : await listLikedPosts(supabase, userId, options);

    return (
      <>
        <ProfilePostGrid posts={result.items} view={view} />
        <ProfilePostPagination
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
  } catch (error) {
    console.error("[profile.post] fetch error:", error);
    return <SectionErrorState title="게시글을 불러오지 못했습니다." />;
  }
}
