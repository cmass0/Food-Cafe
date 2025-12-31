import { unstable_noStore as noStore } from "next/cache";

import { PaginationComponent } from "@/components/pagenation/pagenation";
import * as postService from "@/domain/post/service";
import PostList from "@/domain/post/ui/PostList";
import { getServerSupabase } from "@/lib/supabase/server";

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
  const searchValue = firstValue(searchParams?.search);

  const keyword = searchValue?.trim() ?? undefined;
  const limit = Number.isFinite(limitNumber) && limitNumber > 0 ? limitNumber : DEFAULT_LIMIT;
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  const { items, total } = await postService.listPosts(supabase, {
    page: currentPage,
    limit: limit,
    writerUid: writerUid ?? undefined,
    type: type ?? undefined,
    search: keyword && keyword.length > 0 ? keyword : undefined,
  });

  const pageSize = limit > 0 ? limit : 1;

  const paginationQuery: Record<string, string> = {};
  if (writerUid) paginationQuery.writerUid = writerUid;
  if (type) paginationQuery.type = type;
  if (keyword) paginationQuery.search = keyword;

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <h1 className="text-3xl font-semibold">게시글 목록</h1>
        <PostList posts={items} />
      </main>

      <footer>
        <PaginationComponent
          basePath="/posts"
          page={currentPage}
          pageItemSize={pageSize}
          total={total}
          query={paginationQuery}
        />
      </footer>
    </>
  );
}
