import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import AuthRequiredModal from "@/components/auth/AuthRequiredModal";
import Section from "@/components/status/Section";
import SectionErrorState from "@/components/status/SectionErrorState";
import * as comboService from "@/domain/combo/service";
import * as postService from "@/domain/post/service";
import * as recipeService from "@/domain/recipe/service";
import * as userService from "@/domain/user/service";
import { loadSection } from "@/lib/errors/section";
import { isAuthSessionMissingError } from "@/lib/errors/supabase";
import { cn } from "@/lib/utils";
import {
  BookOpenCheck,
  Bookmark,
  CalendarDays,
  ChefHat,
  Grid3X3,
  Heart,
  List,
  LogOut,
  MessagesSquare,
  Plus,
  UsersRound,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { getServerSupabase } from "@/lib/supabase/server";
import ProfileSearchForm from "./ProfileSearchForm";
import ProfileSortSelect from "./ProfileSortSelect";
import EditSheet from "./edit/EditSheet";
import ComboTabContainer from "./profiletab/combo/ComboTabContainer";
import PostTabContainer from "./profiletab/post/PostTabContainer";
import RecipeTabContainer from "./profiletab/recipe/RecipeTabContainer";
import {
  normalizeProfileSection,
  normalizeProfileSort,
  normalizeProfileTab,
  normalizeProfileView,
  type ProfileSection,
  type ProfileSort,
  type ProfileTab,
  type ProfileView,
} from "./profile-types";

export const dynamic = "force-dynamic";

type ProfileSearchParams = {
  tab?: string | string[];
  page?: string | string[];
  search?: string | string[];
  section?: string | string[];
  sort?: string | string[];
  view?: string | string[];
};

type ProfileHrefOptions = {
  section?: ProfileSection;
  tab?: ProfileTab;
  sort?: ProfileSort;
  view?: ProfileView;
  search?: string;
  page?: number;
};

type SidebarItem = {
  label: string;
  count?: number | null;
  href: string;
  active: boolean;
  icon: LucideIcon;
};

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return undefined;
}

function formatJoinDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function compactCount(value: number | null | undefined) {
  return value ?? 0;
}

function buildProfileNext(searchParams: ProfileSearchParams | undefined): string {
  const params = new URLSearchParams();
  const section = normalizeParam(searchParams?.section);
  const tab = normalizeParam(searchParams?.tab);
  const page = normalizeParam(searchParams?.page);
  const search = normalizeParam(searchParams?.search);
  const sort = normalizeParam(searchParams?.sort);
  const view = normalizeParam(searchParams?.view);

  if (section) params.set("section", section);
  if (tab) params.set("tab", tab);
  if (page) params.set("page", page);
  if (search) params.set("search", search);
  if (sort) params.set("sort", sort);
  if (view) params.set("view", view);

  const query = params.toString();
  return query ? `/profile?${query}` : "/profile";
}

export default async function ProfilePage(props: { searchParams?: Promise<ProfileSearchParams> }) {
  const searchParams = await props.searchParams;
  const supabase = await getServerSupabase();
  // 로그인 확인은 인증 서버를 거치므로 한 번만 하고, 그 결과(ID·이메일)를 아래 조회에 그대로 쓴다.
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError && !isAuthSessionMissingError(authError)) throw authError;
  if (!authUser) {
    return <AuthRequiredModal next={buildProfileNext(searchParams)} />;
  }

  // 프로필과 작성 수는 서로 기다릴 필요가 없어 함께 보낸다.
  const [me, recipeTotalResult, comboTotalResult, postTotalResult] = await Promise.all([
    userService.getUserById(authUser.id),
    loadSection<number | null>(
      "profile.recipe-total",
      () => recipeService.countRecipesByWriter(supabase, authUser.id),
      null
    ),
    loadSection<number | null>(
      "profile.combo-total",
      () => comboService.countCombosByWriter(supabase, authUser.id),
      null
    ),
    loadSection<number | null>(
      "profile.post-total",
      () => postService.countPostsByWriter(supabase, authUser.id),
      null
    ),
  ]);
  if (!me) {
    return <AuthRequiredModal next={buildProfileNext(searchParams)} />;
  }

  const activeTab = normalizeProfileTab(normalizeParam(searchParams?.tab));
  const activeSection = normalizeProfileSection(normalizeParam(searchParams?.section));
  const sort = normalizeProfileSort(normalizeParam(searchParams?.sort));
  const view = normalizeProfileView(normalizeParam(searchParams?.view));
  const pageParam = normalizeParam(searchParams?.page);
  const pageNum = pageParam ? Number(pageParam) : 1;
  const currentPage = Number.isFinite(pageNum) && pageNum > 0 ? Math.trunc(pageNum) : 1;
  const searchParam = normalizeParam(searchParams?.search);
  const search = searchParam?.trim() || undefined;
  const pageSize = 6;
  const currentEmail = authUser.email ?? "";
  const currentPhone = authUser.phone ?? null;
  const recipeTotal = recipeTotalResult.data;
  const comboTotal = comboTotalResult.data;
  const postTotal = postTotalResult.data;
  const hasSummaryError =
    recipeTotalResult.error || comboTotalResult.error || postTotalResult.error;

  function buildHref(options: ProfileHrefOptions = {}) {
    const params = new URLSearchParams();
    params.set("section", options.section ?? activeSection);
    params.set("tab", options.tab ?? activeTab);
    params.set("sort", options.sort ?? sort);
    params.set("view", options.view ?? view);

    const nextSearch = options.search ?? search;
    if (nextSearch) {
      params.set("search", nextSearch);
    }
    if (options.page && options.page > 1) {
      params.set("page", String(options.page));
    }

    return `?${params.toString()}`;
  }

  const sidebarItems: SidebarItem[] = [
    {
      label: "내 레시피",
      count: recipeTotal,
      href: buildHref({ section: "recipe", tab: "written" }),
      active: activeSection === "recipe" && activeTab === "written",
      icon: ChefHat,
    },
    {
      label: "레시피 조합",
      count: comboTotal,
      href: buildHref({ section: "combo", tab: "written" }),
      active: activeSection === "combo" && activeTab === "written",
      icon: BookOpenCheck,
    },
    {
      label: "내 게시글",
      count: postTotal,
      href: buildHref({ section: "post", tab: "written" }),
      active: activeSection === "post" && activeTab === "written",
      icon: MessagesSquare,
    },
    {
      label: "북마크",
      href: buildHref({ tab: "bookmark" }),
      active: activeTab === "bookmark",
      icon: Bookmark,
    },
    {
      label: "좋아요",
      href: buildHref({ tab: "like" }),
      active: activeTab === "like",
      icon: Heart,
    },
  ];

  const toolbar = (
    <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <ProfileSearchForm
        activeTab={activeTab}
        activeSection={activeSection}
        search={search}
        sort={sort}
        view={view}
        className="lg:max-w-[420px]"
      />
      <div className="flex items-center gap-3">
        <ProfileSortSelect value={sort} />
        <div className="flex h-12 items-center rounded-lg bg-zinc-100 p-1">
          <Link
            href={buildHref({ view: "grid" })}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-md transition",
              view === "grid"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
            aria-label="카드 보기"
          >
            <Grid3X3 className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href={buildHref({ view: "list" })}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-md transition",
              view === "list"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            )}
            aria-label="목록 보기"
          >
            <List className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1440px] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <Link href="/" className="flex items-center gap-2 px-1 text-2xl font-black text-zinc-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
              <ChefHat className="h-5 w-5" aria-hidden="true" />
            </span>
            food<span className="text-emerald-700">cafe</span>
          </Link>

          <div className="mt-10 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-4 border-white bg-zinc-100 shadow-md">
              {me.photo_url ? <AvatarImage src={me.photo_url} alt="프로필 이미지" /> : null}
              <AvatarFallback className="bg-zinc-100 text-zinc-500">
                <UserRound className="h-10 w-10" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 max-w-full truncate text-2xl font-black text-zinc-950">
              {me.display_name ?? "-"}
            </h2>
            <p className="mt-1 max-w-full truncate text-sm text-zinc-500">{currentEmail || "-"}</p>
          </div>

          <div className="mt-8 grid gap-3 text-sm">
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" aria-hidden="true" />내 레시피
              </span>
              <span className="font-bold text-emerald-700">{recipeTotal ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4" aria-hidden="true" />
                팔로잉
              </span>
              <span className="font-bold text-zinc-900">{compactCount(me.following_count)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-2">
                <UsersRound className="h-4 w-4" aria-hidden="true" />
                팔로워
              </span>
              <span className="font-bold text-zinc-900">{compactCount(me.follower_count)}</span>
            </div>
          </div>

          {hasSummaryError ? (
            <SectionErrorState
              title="일부 작성 수를 불러오지 못했습니다."
              compact
              className="mt-3"
            />
          ) : null}

          <Separator className="my-8" />

          <Section
            name="profile.menu"
            title="프로필 메뉴를 표시하지 못했습니다."
            compact
            resetKeys={[me.id]}
          >
            <nav className="grid gap-2" aria-label="마이페이지 메뉴">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex h-12 items-center justify-between rounded-lg px-4 text-sm font-semibold transition",
                      item.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </span>
                    {item.count !== undefined ? <span>{item.count ?? "—"}</span> : null}
                  </Link>
                );
              })}
            </nav>
          </Section>

          <Separator className="my-8" />

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              로그아웃
            </button>
          </form>

          <div className="mt-8 rounded-lg bg-emerald-50 p-4 text-center">
            <ChefHat className="mx-auto h-8 w-8 text-emerald-700" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-700">
              맛있는 레시피를
              <br />
              공유하고 소통해보세요!
            </p>
            <Link
              href="/recipes/new"
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-emerald-100 px-4 text-sm font-bold text-emerald-800 hover:bg-emerald-200"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              레시피 작성하기
            </Link>
          </div>
        </aside>

        <section className="min-w-0 space-y-7">
          <section className="relative min-h-[250px] overflow-hidden rounded-lg border border-emerald-100 bg-[#dcefd6] px-6 py-8 shadow-sm sm:px-9">
            <div className="absolute inset-y-0 right-0 hidden w-3/5 bg-[linear-gradient(105deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_38%,rgba(171,211,146,0.48)_100%)] md:block" />
            <div className="absolute right-10 top-6 hidden h-28 w-28 rounded-[40%] border border-emerald-700/20 bg-white/30 rotate-12 md:block" />
            <div className="absolute right-44 bottom-7 hidden h-16 w-32 rounded-[50%] border border-emerald-700/10 bg-white/25 -rotate-12 md:block" />
            <div className="absolute right-24 bottom-12 hidden h-24 w-24 rounded-full border-[14px] border-lime-300/70 bg-lime-100/50 md:block" />
            <div className="relative z-10 flex min-h-[186px] flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <h1 className="text-4xl font-black tracking-normal text-zinc-950">
                  {me.display_name ?? "-"}
                </h1>
                <p className="mt-4 text-base text-zinc-600">{currentEmail || "-"}</p>
                <p className="mt-4 text-base font-medium text-zinc-600">
                  요리를 좋아하는 foodcafe 멤버
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-zinc-600">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    가입일 {formatJoinDate(me.created_at)}
                  </span>
                  <span className="hidden h-4 w-px bg-zinc-300 sm:block" aria-hidden="true" />
                  <span className="flex items-center gap-2 rounded-md bg-white/35 px-3 py-1.5">
                    <BookOpenCheck className="h-4 w-4" aria-hidden="true" />총 작성 레시피{" "}
                    {recipeTotal === null ? "조회 실패" : `${recipeTotal}개`}
                  </span>
                </div>
              </div>
              <EditSheet userProfile={me} currentEmail={currentEmail} currentPhone={currentPhone} />
            </div>
          </section>

          {activeSection === "recipe" ? (
            <RecipeTabContainer
              activeTab={activeTab}
              currentPage={currentPage}
              pageSize={pageSize}
              search={search}
              sort={sort}
              view={view}
              me={me}
              viewerId={me.id}
              toolbar={toolbar}
            />
          ) : activeSection === "combo" ? (
            <ComboTabContainer
              activeTab={activeTab}
              currentPage={currentPage}
              pageSize={pageSize}
              search={search}
              sort={sort}
              view={view}
              me={me}
              viewerId={me.id}
              toolbar={toolbar}
            />
          ) : (
            <PostTabContainer
              activeTab={activeTab}
              currentPage={currentPage}
              pageSize={pageSize}
              userId={me.id}
              search={search}
              sort={sort}
              view={view}
              toolbar={toolbar}
            />
          )}
        </section>
      </div>
    </main>
  );
}
