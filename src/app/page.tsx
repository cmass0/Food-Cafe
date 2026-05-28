import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Apple,
  Beef,
  CakeSlice,
  ChefHat,
  ChevronRight,
  Cookie,
  Eye,
  Facebook,
  Flame,
  Grid3X3,
  Heart,
  Instagram,
  Leaf,
  Mail,
  MessageCircle,
  PencilLine,
  Play,
  Salad,
  Sandwich,
  Search,
  Soup,
  Sparkles,
  Target,
  Twitter,
  Utensils,
  Youtube,
} from "lucide-react";

import breadImage from "@/assets/bread.jpg";
import goulashImage from "@/assets/goulash-soup.jpg";
import pokeImage from "@/assets/poke.jpeg";
import sandwichImage from "@/assets/sandwich.jpeg";
import soupImage from "@/assets/soup.jpeg";
import chickenImage from "@/assets/spicy-braised-chicken.jpeg";
import tteokImage from "@/assets/tteok-bokki.jpeg";
import type { Combos } from "@/domain/combo/types";
import * as comboService from "@/domain/combo/service";
import type { Post } from "@/domain/post/types";
import * as postService from "@/domain/post/service";
import type { Recipe } from "@/domain/recipe/types";
import * as recipeService from "@/domain/recipe/service";
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
  { label: "전체", icon: Grid3X3, active: true },
  { label: "한식", icon: Soup },
  { label: "중식", icon: Beef },
  { label: "일식", icon: Utensils },
  { label: "양식", icon: Sandwich },
  { label: "디저트", icon: CakeSlice },
  { label: "샐러드", icon: Salad },
  { label: "간식", icon: Cookie },
  { label: "다이어트", icon: Leaf },
];

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
  };
}

function comboToFeedItem(combo: Combos, index: number): FeedItem {
  return {
    id: combo.id,
    href: `/combos/${combo.id}`,
    title: combo.title,
    summary: combo.summary ?? "여러 레시피와 아이템을 조합한 추천 구성입니다.",
    image: combo.image ?? fallbackImage(index + 2),
    writerName: combo.writerName ?? "조합러",
    category: combo.tags?.[0] ?? "레시피 조합",
    views: combo.viewCount ?? 0,
    likes: combo.likeCount ?? 0,
    createdAt: combo.createdAt,
  };
}

function postSummary(post: Post): string {
  const text = post.contentText?.replace(/\s+/g, " ").trim();
  if (text) return text.length > 76 ? `${text.slice(0, 76)}...` : text;
  return "FoodCafe 커뮤니티에서 나누는 요리 이야기입니다.";
}

async function getHomeData() {
  try {
    const supabase = await getServerSupabase();
    const [popularRecipes, recentRecipes, trendingCombos, communityPosts] = await Promise.all([
      recipeService.listRecipes(supabase, { limit: 4, sort: "like" }),
      recipeService.listRecipes(supabase, { limit: 4, sort: "recent" }),
      comboService.listCombos(supabase, { limit: 5, sort: "view" }),
      postService.listPosts(supabase, { limit: 4 }),
    ]);

    return {
      popularRecipes: popularRecipes.items,
      recentRecipes: recentRecipes.items,
      trendingCombos: trendingCombos.items,
      communityPosts: communityPosts.items,
    };
  } catch (error) {
    console.error("[home] Failed to load dashboard data", error);
    return {
      popularRecipes: [] as Recipe[],
      recentRecipes: [] as Recipe[],
      trendingCombos: [] as Combos[],
      communityPosts: [] as Post[],
    };
  }
}

function SectionTitle({
  icon,
  title,
  href,
}: {
  icon: ReactNode;
  title: string;
  href: string;
}) {
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

function CommunityCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-zinc-950">
        {post.title}
      </h3>
      <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-zinc-500">
        {postSummary(post)}
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
          {initials(post.writerName)}
        </span>
        <span>{post.writerName}</span>
        <span>{formatAge(post.createdAt)}</span>
      </div>
      <div className="mt-4 flex gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {formatCount(post.commentCount)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {formatCount(post.viewCount)}
        </span>
      </div>
    </Link>
  );
}

function TrendingPanel({ items }: { items: FeedItem[] }) {
  return (
    <aside className="rounded-lg bg-zinc-50 p-5">
      <h2 className="mb-4 text-lg font-bold text-zinc-950">지금 뜨는 레시피</h2>
      <div className="space-y-4">
        {items.map((item, index) => (
          <Link key={item.id} href={item.href} className="flex items-center gap-3">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                index < 3 ? "bg-amber-100 text-amber-700" : "bg-white text-zinc-500"
              }`}
            >
              {index + 1}
            </span>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-emerald-50">
              <Image src={item.image} alt={item.title} fill sizes="48px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-bold text-zinc-900">{item.title}</p>
              <p className="line-clamp-1 text-xs text-zinc-500">{item.category}</p>
            </div>
            <span className="text-xs font-bold text-red-500">▲ {Math.max(7, item.likes + index)}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default async function Home() {
  const { popularRecipes, recentRecipes, trendingCombos, communityPosts } = await getHomeData();
  const popularItems = popularRecipes.map(recipeToFeedItem);
  const recentItems = recentRecipes.map(recipeToFeedItem);
  const trendingItems = trendingCombos.map(comboToFeedItem);
  const rankingItems = [...popularItems, ...trendingItems]
    .sort((a, b) => b.views + b.likes - (a.views + a.likes))
    .slice(0, 5);
  const tagSources = [...popularRecipes.flatMap((recipe) => recipe.tags ?? []), ...trendingCombos.flatMap((combo) => combo.tags ?? [])];
  const tags = Array.from(new Set(tagSources.filter(Boolean))).slice(0, 6);
  const visibleTags = tags.length ? tags : ["간단요리", "다이어트", "집밥", "브런치", "베이킹", "한식"];

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
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-[#4b9855]"
                  placeholder="오늘 뭐 먹지? 레시피를 검색해보세요!"
                />
              </label>
              <button className="h-11 rounded-lg bg-[#438e4d] px-8 text-sm font-bold text-white transition hover:bg-[#34783f]">
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
          {categoryItems.map(({ label, icon: Icon, active }) => (
            <Link key={label} href={label === "전체" ? "/recipes" : `/recipes?search=${encodeURIComponent(label)}&searchField=tag_title`} className="flex shrink-0 flex-col items-center gap-2">
              <span
                className={`grid h-12 w-12 place-items-center rounded-full ${
                  active ? "bg-emerald-100 text-[#3f914b]" : "bg-[#f7f4ef] text-zinc-700"
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
            <SectionTitle icon={<Flame className="h-5 w-5 fill-orange-400 text-orange-500" />} title="인기 레시피" href="/recipes" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {popularItems.map((item, index) => (
                <RecipeCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle icon={<Sparkles className="h-5 w-5 text-amber-500" />} title="새로 올라온 레시피" href="/recipes?sort=recent" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {recentItems.map((item, index) => (
                <RecipeCard key={item.id} item={item} index={index + 4} />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle icon={<MessageCircle className="h-5 w-5 fill-sky-100 text-sky-500" />} title="커뮤니티 인기 이야기" href="/posts" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {communityPosts.map((post) => (
                <CommunityCard key={post.id} post={post} />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900">
                <Target className="h-5 w-5 text-red-500" />
                이번 주 인기 태그
              </h2>
              <Link href="/search" className="flex items-center gap-1 text-sm font-medium text-zinc-500">
                전체 태그 보기 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {visibleTags.map((tag, index) => (
                <Link
                  key={tag}
                  href={`/search?query=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-[#f2f7f1] px-5 py-4 text-center transition hover:bg-emerald-100"
                >
                  <p className="text-sm font-bold text-zinc-900">#{tag}</p>
                  <p className="mt-1 text-xs text-zinc-500">{compactCount((index + 4) * 137)}개 레시피</p>
                </Link>
              ))}
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
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#438e4d] px-4 py-3 text-sm font-bold text-white"
            >
              <PencilLine className="h-4 w-4" />
              레시피 등록하기
            </Link>
            <div className="mt-5 flex justify-end">
              <div className="grid h-24 w-24 place-items-center rounded-lg bg-white/80 text-[#438e4d] shadow-sm">
                <ChefHat className="h-12 w-12" />
              </div>
            </div>
          </section>
          <TrendingPanel items={rankingItems} />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 pb-8 lg:px-8">
        <div className="flex flex-col gap-4 rounded-lg bg-[#edf6ef] p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#438e4d] text-white">
              <Mail className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-950">새로운 레시피와 유용한 요리 팁을 받아보세요!</h2>
              <p className="text-sm text-zinc-500">FoodCafe의 미션 소식과 인기 레시피를 이메일로 받아보실 수 있습니다.</p>
            </div>
          </div>
          <form className="flex w-full gap-2 md:w-[420px]">
            <input
              className="h-11 flex-1 rounded-lg border border-zinc-200 bg-white px-4 text-sm outline-none placeholder:text-zinc-400"
              placeholder="이메일 주소를 입력하세요"
            />
            <button className="h-11 rounded-lg bg-[#438e4d] px-6 text-sm font-bold text-white">구독하기</button>
          </form>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-[#fbfbfb]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-[1.6fr_1fr_1fr_1fr_1.4fr] lg:px-8">
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
            <div className="mt-5 flex gap-4 text-zinc-500">
              <Instagram className="h-4 w-4" />
              <Youtube className="h-4 w-4" />
              <Facebook className="h-4 w-4" />
              <Twitter className="h-4 w-4" />
            </div>
          </div>
          <FooterGroup title="서비스" items={["레시피", "커뮤니티", "이벤트", "인기 레시피"]} />
          <FooterGroup title="고객지원" items={["공지사항", "자주 묻는 질문", "문의하기", "이용약관"]} />
          <FooterGroup title="회사정보" items={["회사소개", "브랜드스토리", "제휴문의"]} />
          <div>
            <h3 className="font-bold text-zinc-950">FoodCafe 앱</h3>
            <p className="mt-3 text-xs text-zinc-500">더 편하게 FoodCafe를 이용해보세요</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-bold">
                <Apple className="h-4 w-4" />
                App Store
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-bold">
                <Play className="h-4 w-4" />
                Google Play
              </button>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-zinc-200 px-5 py-5 text-center text-xs text-zinc-400 lg:px-8">
          © 2026 FoodCafe. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function FooterGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-bold text-zinc-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-zinc-500">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
