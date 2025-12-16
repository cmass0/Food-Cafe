import { unstable_noStore as noStore } from "next/cache";

import { getServerSupabase } from "@/lib/supabase/server";
import * as postService from "@/features/post/service";
import PostList from "@/features/post/ui/PostList";
import { PaginationComponent } from "@/components/pagenation/pagenation";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
  const pageNumber = Number(pageValue);

  const writerUid = firstValue(searchParams?.writerUid);
  const type = firstValue(searchParams?.type);
  const searchValue = firstValue(searchParams?.search);

  const keyword = searchValue?.trim() ?? undefined;
  const limit = 10;

  const { items, total, offset } = await postService.listPosts(supabase, {
    page: Number.isFinite(pageNumber) ? pageNumber : undefined,
    limit: limit,
    writerUid: writerUid ?? undefined,
    type: type ?? undefined,
    search: keyword && keyword.length > 0 ? keyword : undefined,
  });

  const pageSize = limit > 0 ? limit : 1;
  const currentPage = Math.floor(offset / pageSize) + 1;

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
          pageSize={pageSize}
          total={total}
          query={paginationQuery}
        />
      </footer>
    </>
  );
}
