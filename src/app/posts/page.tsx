import {
  BookOpenText,
  ChefHat,
  Flame,
  Grid2X2,
  HelpCircle,
  MessageCircle,
  Sprout,
  UtensilsCrossed,
} from "lucide-react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import * as postService from "@/domain/post/service";
import { normalizePostCategory, type PostCategory } from "@/domain/post/category";
import type { PostSearchField } from "@/domain/post/types";
import PostList from "@/domain/post/ui/PostList";
import * as trendingService from "@/features/trending/service";
import { PaginationComponent } from "@/lib/pagenation/pagenation";
import { getServerSupabase } from "@/lib/supabase/server";
import PostCategorySelect from "./components/PostCategorySelect.client";
import PostCreateButton from "./components/PostCreateButton";
import PostSearchForm from "./components/PostSearchForm";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const DEFAULT_LIMIT = 10;

const POST_CATEGORIES = [
  { value: "all", label: "전체", icon: Grid2X2 },
  { value: "free", label: "자유게시판", icon: MessageCircle },
  { value: "recipe_tip", label: "레시피 팁", icon: UtensilsCrossed },
  { value: "question", label: "질문&답변", icon: HelpCircle },
  { value: "review", label: "후기", icon: BookOpenText },
] as const;

type SearchParamValue = string | string[] | undefined;

type PostsPageProps = {
  searchParams?: Promise<{
    page?: SearchParamValue;
    limit?: SearchParamValue;
    writerUid?: SearchParamValue;
    category?: SearchParamValue;
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
  category,
  search,
  searchField,
}: {
  category: PostCategory;
  search?: string;
  searchField?: PostSearchField;
}) {
  const params = new URLSearchParams();

  params.set("category", category);
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
  const category =
    normalizePostCategory(firstValue(searchParams?.category)) ??
    normalizePostCategory(firstValue(searchParams?.type));
  const searchQuery = firstValue(searchParams?.search)?.trim();
  const fieldParam = (firstValue(searchParams?.searchField) as PostSearchField) ?? "title";

  const limit = Number.isFinite(limitNumber) && limitNumber > 0 ? limitNumber : DEFAULT_LIMIT;
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const activeCategory = category ?? "all";

  const [postList, popularPostList, categoryPostLists] = await Promise.all([
    postService.listPosts(supabase, {
      page: currentPage,
      limit,
      writerUid: writerUid ?? undefined,
      category,
      ...(searchQuery ? { search: searchQuery, searchField: fieldParam } : {}),
    }),
    trendingService.listTrendingPosts(supabase, 5),
    Promise.all(
      POST_CATEGORIES.map((category) =>
        postService.listPosts(supabase, {
          page: 1,
          limit: 1,
          ...(category.value === "all" ? {} : { category: category.value }),
        })
      )
    ),
  ]);

  const { items, total } = postList;
  const categoryTotals = new Map(
    POST_CATEGORIES.map((category, index) => [category.value, categoryPostLists[index]?.total ?? 0])
  );

  const pageSize = limit > 0 ? limit : 1;

  const paginationQuery: Record<string, string> = {};
  if (writerUid) paginationQuery.writerUid = writerUid;
  if (category) paginationQuery.category = category;
  if (searchQuery) {
    paginationQuery.search = searchQuery;
    paginationQuery.searchField = fieldParam;
  }

  return (
    <main className="min-h-[calc(100vh-68px)] bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-5 py-12 lg:px-8 lg:py-14">
        <section>
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#dff3df] text-[#15933d] shadow-sm">
                <MessageCircle className="h-6 w-6 fill-[#66c477] text-white" />
              </span>
              <h1 className="text-4xl font-black tracking-tight text-zinc-950">커뮤니티</h1>
            </div>
            <p className="mt-3 text-base font-medium text-zinc-600">
              레시피 팁부터 일상 이야기까지, 함께 나누고 소통해요!
            </p>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <section className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <PostCategorySelect
                categories={POST_CATEGORIES.map(({ value, label }) => ({ value, label }))}
                activeCategory={activeCategory}
                search={searchQuery}
                searchField={fieldParam}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <PostSearchForm className="w-full sm:min-w-72" />
                {/* 중복 기능 */}
                {/* <PostCreateButton className="shrink-0" /> */}
              </div>
            </section>

            <section className="mt-6">
              <PostList
                posts={items}
                variant="community"
                detailListContext={{ listPage: currentPage, listLimit: pageSize }}
              />
            </section>

            <footer className="mt-7 flex justify-center pb-6">
              <PaginationComponent
                basePath="/posts"
                page={currentPage}
                pageItemSize={pageSize}
                total={total}
                query={paginationQuery}
              />
            </footer>
          </div>

          <aside className="hidden space-y-4 xl:block">
            <section className="relative overflow-hidden rounded-2xl border border-[#d9efd9] bg-gradient-to-br from-[#e7f7e7] via-[#fbfef9] to-[#edf9e6] p-6 shadow-[0_12px_30px_rgba(73,161,84,0.08)]">
              <Sprout className="absolute right-6 top-5 h-10 w-10 text-[#63bf62]" />
              <ChefHat
                className="absolute bottom-5 right-6 h-20 w-20 text-[#f5a646]"
                strokeWidth={1.4}
              />
              <UtensilsCrossed
                className="absolute bottom-4 right-24 h-10 w-10 rotate-[-20deg] text-[#67c779]"
                strokeWidth={1.5}
              />
              <h2 className="text-lg font-black text-zinc-950">함께 나누는 공간</h2>
              <p className="mt-2 max-w-[170px] text-sm leading-6 text-zinc-600">
                요리에 대한 모든 이야기, 여러분의 소중한 경험을 공유해주세요!
              </p>
              <PostCreateButton className="relative mt-4 h-10 px-4 text-sm" />
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-black text-zinc-950">
                  <Flame className="h-5 w-5 fill-orange-400 text-orange-500" /> 최근 7일 인기글
                </h2>
                <Link
                  href="/posts"
                  className="text-xs font-medium text-zinc-500 hover:text-[#16883d]"
                >
                  더보기 ›
                </Link>
              </div>
              <ol className="mt-4 space-y-3">
                {popularPostList.length > 0 ? (
                  popularPostList.map((post, index) => (
                    <li key={post.id} className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-[#16883d]">
                        {index + 1}
                      </span>
                      <Link
                        href={`/posts/${post.id}`}
                        prefetch={false}
                        className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-700 hover:text-[#16883d]"
                      >
                        {post.title}
                      </Link>
                      <span className="shrink-0 text-xs font-medium text-rose-500">
                        활동 {post.recentActivityCount}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="py-3 text-center text-sm text-zinc-500">
                    아직 인기글이 없습니다.
                  </li>
                )}
              </ol>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-zinc-950">카테고리</h2>
              <ul className="mt-4 space-y-3">
                {POST_CATEGORIES.slice(1).map((category) => {
                  const CategoryIcon = category.icon;
                  return (
                    <li key={category.value}>
                      <Link
                        href={buildCategoryHref({
                          category: normalizePostCategory(category.value)!,
                        })}
                        className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-[#16883d]"
                      >
                        <CategoryIcon className="h-4 w-4 text-[#67b979]" />
                        <span className="flex-1">{category.label}</span>
                        <span className="text-zinc-500">
                          ({categoryTotals.get(category.value) ?? 0})
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
