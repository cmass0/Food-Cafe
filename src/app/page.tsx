import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Beef,
  CakeSlice,
  ChefHat,
  ChevronRight,
  Cookie,
  Eye,
  Flame,
  Grid3X3,
  Heart,
  Leaf,
  MessageCircle,
  PencilLine,
  Salad,
  Sandwich,
  Search,
  Soup,
  Sparkles,
  Target,
  Utensils,
} from "lucide-react";

import breadImage from "@/assets/bread.jpg";
import goulashImage from "@/assets/goulash-soup.jpg";
import pokeImage from "@/assets/poke.jpeg";
import sandwichImage from "@/assets/sandwich.jpeg";
import soupImage from "@/assets/soup.jpeg";
import chickenImage from "@/assets/spicy-braised-chicken.jpeg";
import tteokImage from "@/assets/tteok-bokki.jpeg";
import SectionErrorState from "@/components/status/SectionErrorState";
import Section from "@/components/status/Section";
import type { Recipe } from "@/domain/recipe/types";
import * as recipeService from "@/domain/recipe/service";
import * as trendingService from "@/features/trending/service";
import type { TrendingContentItem, TrendingRecipeTag } from "@/features/trending/types";
import { loadSection } from "@/lib/errors/section";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ImageSource = string | StaticImageData;

type FeedItem = {
  id: string;
  href: string;
  title: string;
  summary: string;
  image: ImageSource;
  writerName: string;
  category: string;
  views: number;
  likes: number;
  createdAt: Date;
  recentParticipantCount: number;
};

const fallbackImages = [
  chickenImage,
  pokeImage,
  goulashImage,
  breadImage,
  soupImage,
  sandwichImage,
  tteokImage,
];

const categoryItems = [
  { key: null, label: "전체", icon: Grid3X3 },
  { key: "korean", label: "한식", icon: Soup },
  { key: "chinese", label: "중식", icon: Beef },
  { key: "japanese", label: "일식", icon: Utensils },
  { key: "western", label: "양식", icon: Sandwich },
  { key: "dessert", label: "디저트", icon: CakeSlice },
  { key: "salad", label: "샐러드", icon: Salad },
  { key: "snack", label: "간식", icon: Cookie },
  { key: "diet", label: "다이어트", icon: Leaf },
] as const;

function fallbackImage(index: number): StaticImageData {
  return fallbackImages[index % fallbackImages.length] ?? breadImage;
}

function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function compactCount(value: number | null | undefined): string {
  const count = value ?? 0;
  if (count >= 10000) return `${Math.floor(count / 1000) / 10}만`;
  if (count >= 1000) return `${Math.floor(count / 100) / 10}천`;
  return String(count);
}

function formatAge(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.max(1, Math.floor(diff / 86_400_000));
  if (days < 2) return "오늘";
  if (days < 7) return `${days}일 전`;
  if (days < 31) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "U";
}

function recipeToFeedItem(recipe: Recipe, index: number): FeedItem {
  return {
    id: recipe.id,
    href: `/recipes/${recipe.id}`,
    title: recipe.title,
    summary: recipe.summary ?? "함께 나누고 싶은 맛있는 레시피입니다.",
    image: recipe.image ?? fallbackImage(index),
    writerName: recipe.writerName ?? "레시피러",
    category: recipe.category ?? recipe.tags?.[0] ?? "홈메이드",
    views: recipe.viewCount ?? 0,
    likes: recipe.likeCount ?? 0,
    createdAt: recipe.createdAt,
    recentParticipantCount: 0,
  };
}

function trendingToFeedItem(item: TrendingContentItem, index: number): FeedItem {
  const path =
    item.resourceType === "recipe" ? "recipes" : item.resourceType === "combo" ? "combos" : "posts";
  const defaultCategory =
    item.resourceType === "recipe"
      ? "레시피"
      : item.resourceType === "combo"
        ? "레시피 조합"
        : "커뮤니티";

  return {
    id: item.id,
    href: `/${path}/${item.id}`,
    title: item.title,
    summary: item.summary ?? "최근 7일 동안 많은 참여를 받은 콘텐츠입니다.",
    image: item.image ?? fallbackImage(index + 2),
    writerName: item.writerName ?? "FoodCafe 사용자",
    category: item.tags[0] ?? defaultCategory,
    views: item.viewCount,
    likes: item.likeCount,
    createdAt: new Date(item.createdAt),
    recentParticipantCount: item.recentParticipantCount,
  };
}

async function getHomeData() {
  const supabase = await getServerSupabase();
  const [popularRecipes, recentRecipes, trendingCombos, communityPosts, trendingTags] =
    await Promise.all([
      loadSection(
        "home.popular-recipes",
        () => trendingService.listTrendingRecipes(supabase, 4),
        [] as TrendingContentItem[]
      ),
      loadSection(
        "home.recent-recipes",
        async () => (await recipeService.listRecipes(supabase, { limit: 4, sort: "recent" })).items,
        [] as Recipe[]
      ),
      loadSection(
        "home.trending-combos",
        () => trendingService.listTrendingCombos(supabase, 5),
        [] as TrendingContentItem[]
      ),
      loadSection(
        "home.community-posts",
        () => trendingService.listTrendingPosts(supabase, 4),
        [] as TrendingContentItem[]
      ),
      loadSection(
        "home.trending-recipe-tags",
        () => trendingService.listTrendingRecipeTags(supabase, 6),
        [] as TrendingRecipeTag[]
      ),
    ]);

  return { popularRecipes, recentRecipes, trendingCombos, communityPosts, trendingTags };
}

function HomeSectionStatus({
  emptyMessage,
  className,
}: {
  emptyMessage: string;
  className: string;
}) {
  return (
    <p className={className} role="status">
      {emptyMessage}
    </p>
  );
}

function SectionTitle({ icon, title, href }: { icon: ReactNode; title: string; href: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900">
        {icon}
        {title}
      </h2>
      <Link href={href} className="flex items-center gap-1 text-sm font-medium text-zinc-500">
        더보기 <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function RecipeCard({ item, index }: { item: FeedItem; index: number }) {
  return (
    <Link
      href={item.href}
      className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-emerald-50">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 50vw, 220px"
          priority={index < 2}
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-zinc-950">{item.title}</h3>
        <p className="line-clamp-1 text-xs text-zinc-500">{item.summary}</p>
        <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
            {initials(item.writerName)}
          </span>
          <span className="line-clamp-1">{item.writerName}</span>
        </div>
        <div className="flex items-center gap-4 pt-1 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatCount(item.views)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatCount(item.likes)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CommunityCard({ post }: { post: TrendingContentItem }) {
  const writerName = post.writerName ?? "FoodCafe 사용자";

  return (
    <Link
      href={`/posts/${post.id}`}
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-zinc-950">
        {post.title}
      </h3>
      <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-zinc-500">
        {post.summary ?? "FoodCafe 커뮤니티에서 나누는 요리 이야기입니다."}
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
          {initials(writerName)}
        </span>
        <span>{writerName}</span>
        <span>{formatAge(new Date(post.createdAt))}</span>
      </div>
      <div className="mt-4 flex gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {formatCount(post.recentCommentCount)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {formatCount(post.viewCount)}
        </span>
      </div>
    </Link>
  );
}

function TrendingPanel({ items, hasError }: { items: FeedItem[]; hasError: boolean }) {
  return (
    <aside className="rounded-lg bg-zinc-50 p-5">
      <h2 className="mb-4 text-lg font-bold text-zinc-950">지금 뜨는 레시피·조합</h2>
      <div className="space-y-4">
        <Section
          name="home.ranking"
          failed={hasError && items.length === 0}
          title="순위를 표시하지 못했습니다."
          compact
        >
          {hasError && items.length > 0 ? (
            <SectionErrorState title="일부 순위 데이터를 불러오지 못했습니다." compact />
          ) : null}
          {items.length > 0 ? (
            items.map((item, index) => (
              <Link key={item.id} href={item.href} className="flex items-center gap-3">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                    index < 3 ? "bg-amber-100 text-amber-700" : "bg-white text-zinc-500"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-emerald-50">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold text-zinc-900">{item.title}</p>
                  <p className="line-clamp-1 text-xs text-zinc-500">{item.category}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-emerald-700">
                  참여 {item.recentParticipantCount}명
                </span>
              </Link>
            ))
          ) : (
            <HomeSectionStatus
              emptyMessage="최근 7일 동안 집계된 활동이 없습니다."
              className="py-6 text-center text-sm text-zinc-500"
            />
          )}
        </Section>
      </div>
    </aside>
  );
}

export default async function Home() {
  const { popularRecipes, recentRecipes, trendingCombos, communityPosts, trendingTags } =
    await getHomeData();
  const popularItems = popularRecipes.data.map(trendingToFeedItem);
  const recentItems = recentRecipes.data.map(recipeToFeedItem);
  const rankingItems = trendingService
    .sortTrendingItems([...popularRecipes.data, ...trendingCombos.data])
    .slice(0, 5)
    .map(trendingToFeedItem);
  const rankingHasError = popularRecipes.error || trendingCombos.error;

  return (
    <main className="bg-white text-zinc-950">
      <section className="border-b border-zinc-200 bg-[#fbfaf7]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[1fr_0.95fr] md:py-14 lg:px-8">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-zinc-950 md:text-5xl">
              함께 나누는 레시피,
              <br />
              <span className="text-[#3f914b]">더 맛있는 하루</span>
            </h1>
            <p className="mt-5 text-sm leading-6 text-zinc-500">
              누구나 따라 할 수 있는 레시피를 공유하고
              <br />
              요리로 소통해보세요.
            </p>
            <form action="/search" className="mt-6 flex max-w-xl gap-3">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  name="query"
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-400 focus-visible:border-[#438e4d] focus-visible:ring-2 focus-visible:ring-[#438e4d]/30"
                  placeholder="오늘 뭐 먹지? 레시피를 검색해보세요!"
                />
              </label>
              <button className="h-11 rounded-lg bg-[#34783f] px-8 text-sm font-bold text-white transition hover:bg-[#2f6f39]">
                검색
              </button>
            </form>
          </div>
          <div className="relative hidden min-h-[280px] overflow-hidden rounded-lg md:block">
            <Image
              src={breadImage}
              alt="레시피 노트와 신선한 재료"
              fill
              priority
              sizes="50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#fbfaf7] via-white/20 to-transparent" />
            <div className="absolute right-10 top-10 rounded-lg bg-white/80 px-5 py-4 text-center shadow-sm backdrop-blur">
              <p className="font-serif text-2xl italic text-amber-800/60">Recipe</p>
              <p className="mt-1 text-xs text-zinc-400">fresh daily table</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <div className="flex items-center gap-7 overflow-x-auto pb-2">
          {categoryItems.map(({ key, label, icon: Icon }) => (
            <Link
              key={label}
              href={key ? `/recipes?category=${key}` : "/recipes"}
              className="flex shrink-0 flex-col items-center gap-2"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-full ${
                  key === null ? "bg-emerald-100 text-[#34783f]" : "bg-[#f7f4ef] text-zinc-700"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-zinc-700">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
        <div className="space-y-10">
          <section>
            <SectionTitle
              icon={<Flame className="h-5 w-5 fill-orange-400 text-orange-500" />}
              title="최근 7일 인기 레시피"
              href="/ranking"
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Section
                name="home.popular-recipes"
                failed={popularRecipes.error}
                title="인기 레시피를 표시하지 못했습니다."
                compact
                errorClassName="col-span-full"
              >
                {popularItems.length === 0 ? (
                  <HomeSectionStatus
                    emptyMessage="최근 7일 동안 집계된 인기 레시피가 없습니다."
                    className="col-span-full rounded-lg bg-zinc-50 py-10 text-center text-sm text-zinc-500"
                  />
                ) : (
                  popularItems.map((item, index) => (
                    <RecipeCard key={item.id} item={item} index={index} />
                  ))
                )}
              </Section>
            </div>
          </section>

          <section>
            <SectionTitle
              icon={<Sparkles className="h-5 w-5 text-amber-500" />}
              title="새로 올라온 레시피"
              href="/recipes?sort=recent"
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Section
                name="home.recent-recipes"
                failed={recentRecipes.error}
                title="최신 레시피를 표시하지 못했습니다."
                compact
                errorClassName="col-span-full"
              >
                {recentItems.length === 0 ? (
                  <HomeSectionStatus
                    emptyMessage="아직 등록된 레시피가 없습니다."
                    className="col-span-full rounded-lg bg-zinc-50 py-10 text-center text-sm text-zinc-500"
                  />
                ) : (
                  recentItems.map((item, index) => (
                    <RecipeCard key={item.id} item={item} index={index + 4} />
                  ))
                )}
              </Section>
            </div>
          </section>

          <section>
            <SectionTitle
              icon={<MessageCircle className="h-5 w-5 fill-sky-100 text-sky-500" />}
              title="커뮤니티 인기 이야기"
              href="/posts"
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Section
                name="home.community-posts"
                failed={communityPosts.error}
                title="인기 이야기를 표시하지 못했습니다."
                compact
                errorClassName="col-span-full"
              >
                {communityPosts.data.length === 0 ? (
                  <HomeSectionStatus
                    emptyMessage="최근 7일 동안 집계된 인기 이야기가 없습니다."
                    className="col-span-full rounded-lg bg-zinc-50 py-10 text-center text-sm text-zinc-500"
                  />
                ) : (
                  communityPosts.data.map((post) => <CommunityCard key={post.id} post={post} />)
                )}
              </Section>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900">
                <Target className="h-5 w-5 text-red-500" />
                이번 주 인기 태그
              </h2>
              <Link
                href="/search"
                className="flex items-center gap-1 text-sm font-medium text-zinc-500"
              >
                전체 태그 보기 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Section
                name="home.trending-recipe-tags"
                failed={trendingTags.error}
                title="인기 태그를 표시하지 못했습니다."
                compact
                errorClassName="col-span-full"
              >
                {trendingTags.data.length === 0 ? (
                  <HomeSectionStatus
                    emptyMessage="최근 7일 동안 집계된 인기 태그가 없습니다."
                    className="col-span-full rounded-full bg-zinc-50 px-5 py-4 text-center text-sm text-zinc-500"
                  />
                ) : (
                  trendingTags.data.map((tag) => (
                    <Link
                      key={tag.tag}
                      href={`/search?query=${encodeURIComponent(tag.tag)}`}
                      className="rounded-full bg-[#f2f7f1] px-5 py-4 text-center transition hover:bg-emerald-100"
                    >
                      <p className="text-sm font-bold text-zinc-900">#{tag.tag}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {compactCount(tag.totalRecipeCount)}개 레시피
                      </p>
                    </Link>
                  ))
                )}
              </Section>
            </div>
          </section>
        </div>

        <div className="space-y-4 lg:pt-3">
          <section className="overflow-hidden rounded-lg bg-[#eef6ee] p-5">
            <h2 className="text-lg font-bold text-zinc-950">레시피를 공유해보세요!</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              당신의 레시피가 누군가의 오늘을 더 맛있게 만들어요.
            </p>
            <Link
              href="/recipes/new"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#34783f] px-4 py-3 text-sm font-bold text-white hover:bg-[#2f6f39]"
            >
              <PencilLine className="h-4 w-4" />
              레시피 등록하기
            </Link>
          </section>
          <TrendingPanel items={rankingItems} hasError={rankingHasError} />
        </div>
      </div>

      <footer className="border-t border-zinc-200 bg-[#fbfbfb]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 md:flex-row md:items-end md:justify-between lg:px-8">
          <div>
            <Link href="/" className="flex items-center gap-2 text-2xl font-black text-zinc-950">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#438e4d] text-white">
                <ChefHat className="h-5 w-5" />
              </span>
              FoodCafe
            </Link>
            <p className="mt-4 text-sm leading-6 text-zinc-500">
              함께 나누는 레시피, 더 맛있는 하루
              <br />
              요리로 연결되는 따뜻한 커뮤니티
            </p>
          </div>
          <p className="text-xs text-zinc-400">© 2026 FoodCafe. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
