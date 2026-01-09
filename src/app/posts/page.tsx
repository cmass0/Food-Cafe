import { unstable_noStore as noStore } from "next/cache";

import { PaginationComponent } from "@/components/pagenation/pagenation";
import * as postService from "@/domain/post/service";
import type { PostSearchField } from "@/domain/post/types";
import PostList from "@/domain/post/ui/PostList";
import { getServerSupabase } from "@/lib/supabase/server";
import PostSearchForm from "./PostSearchForm";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const DEFAULT_LIMIT = 10;

type SearchParamValue = string | string[] | undefined;

type PostsPageProps = {
  searchParams?: {
    page?: SearchParamValue;
    limit?: SearchParamValue;
    writerUid?: SearchParamValue;
    type?: SearchParamValue;
    search?: SearchParamValue;
    searchField?: SearchParamValue;
  };
};

function firstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  noStore();
  const supabase = getServerSupabase();

  const pageValue = firstValue(searchParams?.page);
  const limitValue = firstValue(searchParams?.limit);
  const pageNumber = Number(pageValue);
  const limitNumber = Number(limitValue);

  const writerUid = firstValue(searchParams?.writerUid);
  const type = firstValue(searchParams?.type);
  const searchQuery = firstValue(searchParams?.search)?.trim();
  const fieldParam =
    (firstValue(searchParams?.searchField) as PostSearchField) ?? "title";

  const limit = Number.isFinite(limitNumber) && limitNumber > 0 ? limitNumber : DEFAULT_LIMIT;
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  const { items, total } = await postService.listPosts(supabase, {
    page: currentPage,
    limit: limit,
    writerUid: writerUid ?? undefined,
    type: type ?? undefined,
    ...(searchQuery ? { search: searchQuery, searchField: fieldParam } : {}),
  });

  const pageSize = limit > 0 ? limit : 1;

  // 페이지 네이션 동작 시 기존의 검색 쿼리를 유지하기위해 정보 저장
  const paginationQuery: Record<string, string> = {};
  if (writerUid) paginationQuery.writerUid = writerUid;
  if (type) paginationQuery.type = type;
  if (searchQuery) {
    paginationQuery.search = searchQuery;
    paginationQuery.searchField = fieldParam;
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <h1 className="text-3xl font-semibold">게시글 목록</h1>
        <PostList posts={items} />
      </main>

      <footer className="flex flex-col items-center gap-4 pb-10">
        <PaginationComponent
          basePath="/posts"
          page={currentPage}
          pageItemSize={pageSize}
          total={total}
          query={paginationQuery}
        />
        <PostSearchForm />
      </footer>
    </>
  );
}
