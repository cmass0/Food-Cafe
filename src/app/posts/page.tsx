import { ChefHat, Flame, Heart, MessageCircle, Sprout, UtensilsCrossed } from "lucide-react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import Section from "@/components/status/Section";
import * as postService from "@/domain/post/service";
import { normalizePostCategory } from "@/domain/post/category";
import type { PostListResult, PostSearchField } from "@/domain/post/types";
import PostList from "@/app/posts/ui/PostList";
import * as trendingService from "@/features/trending/service";
import type { TrendingContentItem } from "@/features/trending/types";
import { PaginationComponent } from "@/components/Pagination";
import { loadSection } from "@/lib/errors/section";
import { getServerSupabase } from "@/lib/supabase/server";
import PostCategorySelect from "./components/PostCategorySelect.client";
import PostCreateButton from "./components/PostCreateButton";
import PostSearchForm from "./components/PostSearchForm";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const DEFAULT_LIMIT = 10;

const POST_CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "free", label: "자유게시판" },
  { value: "recipe_tip", label: "레시피 팁" },
  { value: "question", label: "질문&답변" },
  { value: "review", label: "후기" },
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
  const emptyPostList: PostListResult = {
    items: [],
    total: 0,
    limit,
    hasMore: false,
    offset: (currentPage - 1) * limit,
  };

  const [postListResult, popularPostListResult] = await Promise.all([
    loadSection(
      "posts.list",
      () =>
        postService.listPosts(supabase, {
          page: currentPage,
          limit,
          writerUid: writerUid ?? undefined,
          category,
          ...(searchQuery ? { search: searchQuery, searchField: fieldParam } : {}),
        }),
      emptyPostList
    ),
    loadSection<TrendingContentItem[]>(
      "posts.popular",
      () => trendingService.listTrendingPosts(supabase, 5),
      []
    ),
  ]);

  // 게시판 목록이 이 화면의 본문이므로, 없는 페이지 요청은 페이지 자체를 404로 처리한다.
  if (postListResult.outOfRange) notFound();

  const { items, total } = postListResult.data;
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
          <div className="min-w-0">
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
              <Section
                name="posts.list"
                failed={postListResult.error}
                title="게시글 목록을 표시하지 못했습니다."
                resetKeys={[currentPage, limit, writerUid, category, searchQuery, fieldParam]}
              >
                <PostList
                  posts={items}
                  variant="community"
                  detailListContext={{ listPage: currentPage, listLimit: pageSize }}
                />
                <footer className="mt-7 flex justify-center pb-6">
                  <PaginationComponent
                    basePath="/posts"
                    page={currentPage}
                    pageItemSize={pageSize}
                    total={total}
                    query={paginationQuery}
                  />
                </footer>
              </Section>
            </section>
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
              <Section
                name="posts.popular"
                failed={popularPostListResult.error}
                title="인기글을 표시하지 못했습니다."
                compact
                errorClassName="mt-4"
              >
                <ol className="mt-4 space-y-3">
                  {popularPostListResult.data.length > 0 ? (
                    popularPostListResult.data.map((post, index) => (
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
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-rose-500">
                          <Heart className="h-3 w-3 fill-rose-400" aria-hidden="true" />
                          <span className="sr-only">좋아요</span>
                          {post.likeCount}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="py-3 text-center text-sm text-zinc-500">
                      아직 인기글이 없습니다.
                    </li>
                  )}
                </ol>
              </Section>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
