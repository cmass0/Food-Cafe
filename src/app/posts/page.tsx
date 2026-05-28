import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { Sprout } from "lucide-react";

import * as postService from "@/domain/post/service";
import type { PostSearchField } from "@/domain/post/types";
import PostList from "@/domain/post/ui/PostList";
import { PaginationComponent } from "@/lib/pagenation/pagenation";
import { getServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import PostCreateButton from "./components/PostCreateButton";
import PostSearchForm from "./components/PostSearchForm";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const DEFAULT_LIMIT = 10;

const POST_CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "board", label: "자유" },
  { value: "question", label: "질문" },
  { value: "info", label: "정보" },
  { value: "review", label: "후기" },
] as const;

type SearchParamValue = string | string[] | undefined;

type PostsPageProps = {
  searchParams?: Promise<{
    page?: SearchParamValue;
    limit?: SearchParamValue;
    writerUid?: SearchParamValue;
    type?: SearchParamValue;
    search?: SearchParamValue;
    searchField?: SearchParamValue;
  }>;
};

function firstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildCategoryHref({
  type,
  search,
  searchField,
}: {
  type: string;
  search?: string;
  searchField?: PostSearchField;
}) {
  const params = new URLSearchParams();

  if (type !== "all") {
    params.set("type", type);
  }
  if (search) {
    params.set("search", search);
    params.set("searchField", searchField ?? "title");
  }

  const queryString = params.toString();
  return queryString ? `/posts?${queryString}` : "/posts";
}

export default async function PostsPage(props: PostsPageProps) {
  const searchParams = await props.searchParams;
  noStore();
  const supabase = await getServerSupabase();

  const pageValue = firstValue(searchParams?.page);
  const limitValue = firstValue(searchParams?.limit);
  const pageNumber = Number(pageValue);
  const limitNumber = Number(limitValue);

  const writerUid = firstValue(searchParams?.writerUid);
  const type = firstValue(searchParams?.type);
  const searchQuery = firstValue(searchParams?.search)?.trim();
  const fieldParam = (firstValue(searchParams?.searchField) as PostSearchField) ?? "title";

  const limit = Number.isFinite(limitNumber) && limitNumber > 0 ? limitNumber : DEFAULT_LIMIT;
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const activeType = type ?? "all";

  const { items, total } = await postService.listPosts(supabase, {
    page: currentPage,
    limit,
    writerUid: writerUid ?? undefined,
    type: type ?? undefined,
    ...(searchQuery ? { search: searchQuery, searchField: fieldParam } : {}),
  });

  const pageSize = limit > 0 ? limit : 1;

  const paginationQuery: Record<string, string> = {};
  if (writerUid) paginationQuery.writerUid = writerUid;
  if (type) paginationQuery.type = type;
  if (searchQuery) {
    paginationQuery.search = searchQuery;
    paginationQuery.searchField = fieldParam;
  }

  return (
    <main className="min-h-[calc(100vh-68px)] bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-12 lg:px-8">
        <section className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-zinc-950">게시글 목록</h1>
              <Sprout className="h-6 w-6 text-[#15933d]" />
            </div>
            <p className="mt-3 text-base font-medium text-zinc-500">
              다양한 이야기와 정보를 나눠보세요!
            </p>
          </div>
          <PostCreateButton />
        </section>

        <section className="mt-9 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <nav
            aria-label="게시글 유형"
            className="flex w-fit rounded-full bg-zinc-100 p-1 text-sm font-bold text-zinc-500"
          >
            {POST_CATEGORIES.map((category) => {
              const isActive = activeType === category.value;
              return (
                <Link
                  key={category.value}
                  href={buildCategoryHref({
                    type: category.value,
                    search: searchQuery,
                    searchField: fieldParam,
                  })}
                  prefetch={false}
                  className={cn(
                    "rounded-full px-5 py-2 transition",
                    isActive
                      ? "bg-[#15933d] text-white shadow-sm"
                      : "text-zinc-600 hover:bg-white hover:text-zinc-900"
                  )}
                >
                  {category.label}
                </Link>
              );
            })}
          </nav>

          <PostSearchForm className="lg:max-w-[420px] lg:justify-end" />
        </section>

        <section className="mt-7">
          <PostList posts={items} />
        </section>

        <footer className="mt-7 flex flex-col items-center gap-4 pb-6">
          <PaginationComponent
            basePath="/posts"
            page={currentPage}
            pageItemSize={pageSize}
            total={total}
            query={paginationQuery}
          />
          <PostSearchForm className="max-w-[520px]" />
        </footer>
      </div>
    </main>
  );
}
