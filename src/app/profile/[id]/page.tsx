import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as userFollowService from "@/domain/follow/service";
import ProfileFollowHeader from "@/domain/follow/ui/ProfileFollowHeader";
import * as userService from "@/domain/user/service";

import { getServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import ProfileSearchForm from "../ProfileSearchForm";
import ComboTabContainer from "../profiletab/combo/ComboTabContainer";
import RecipeTabContainer from "../profiletab/recipe/RecipeTabContainer";
import {
  normalizeProfileSection,
  normalizeProfileSort,
  normalizeProfileView,
} from "../profile-types";

export const dynamic = "force-dynamic";

type ProfileSearchParams = {
  tab?: string | string[];
  page?: string | string[];
  search?: string | string[];
  section?: string | string[];
  sort?: string | string[];
  view?: string | string[];
};

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return undefined;
}

export default async function ProfilePage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<ProfileSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const supabase = await getServerSupabase();

  // 타 사용자 정보 가져오기
  const another_user = await userService.getUserById(params.id);
  if (!another_user) {
    return notFound();
  }

  // 내 정보 가져오기
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const isSelf = viewer?.id === another_user.id;
  if (isSelf) redirect("/profile");

  let isFollowing = false;

  if (viewer) {
    isFollowing = await userFollowService.checkIsFollowing(supabase, viewer.id, another_user.id);
  }

  const requestedTab = normalizeParam(searchParams?.tab);
  const activeTab = "written" as const;
  const normalizedSection = normalizeProfileSection(normalizeParam(searchParams?.section));
  // 게시글 활동은 현재 마이페이지 전용이다. 공개 프로필에서는 기존 공개 섹션만 허용한다.
  const activeSection = normalizedSection === "post" ? "recipe" : normalizedSection;
  const requestedSort = normalizeParam(searchParams?.sort);
  const normalizedSort = normalizeProfileSort(requestedSort);
  const sort = normalizedSort === "like" ? "like" : "recent";
  const view = normalizeProfileView(normalizeParam(searchParams?.view));
  const pageParam = normalizeParam(searchParams?.page);
  const pageNum = pageParam ? Number(pageParam) : 1;
  const currentPage = Number.isFinite(pageNum) && pageNum > 0 ? Math.trunc(pageNum) : 1;
  const searchParam = normalizeParam(searchParams?.search);
  const search = searchParam?.trim() || undefined;
  const pageSize = 6;

  if (
    (requestedTab && requestedTab !== activeTab) ||
    normalizedSection === "post" ||
    (requestedSort && requestedSort !== sort)
  ) {
    const canonicalParams = new URLSearchParams({
      section: activeSection,
      tab: activeTab,
      sort,
      view,
    });
    if (search) canonicalParams.set("search", search);
    redirect(`/profile/${another_user.id}?${canonicalParams.toString()}`);
  }

  function buildSectionHref(section: "recipe" | "combo") {
    const params = new URLSearchParams();
    params.set("section", section);
    params.set("tab", activeTab);
    params.set("sort", sort);
    params.set("view", view);
    if (search) {
      params.set("search", search);
    }
    return `?${params.toString()}`;
  }

  function buildSortHref(nextSort: "recent" | "like") {
    const params = new URLSearchParams();
    params.set("section", activeSection);
    params.set("tab", activeTab);
    params.set("sort", nextSort);
    params.set("view", view);
    if (search) params.set("search", search);
    return `?${params.toString()}`;
  }

  return (
    <main className="pt-[50px] pb-[50px]">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 md:px-6">
        <Card className="w-full min-h-[200px] overflow-hidden">
          <div className="h-[100px] bg-gradient-to-r from-green-200 to-green-600 md:h-[110px]" />
          <CardContent className="pt-0">
            <ProfileFollowHeader
              targetUserId={another_user.id}
              displayName={another_user.display_name ?? null}
              photoUrl={another_user.photo_url ?? null}
              initialIsFollowing={isFollowing}
              initialFollowerCount={another_user?.follower_count ?? 0}
              initialFollowingCount={another_user?.following_count ?? 0}
              showButton
            />
          </CardContent>
        </Card>
        <div className="flex items-center justify-between rounded-2xl border-1.5 px-1.5 pb-2 pt-2">
          <ProfileSearchForm
            activeTab={activeTab}
            activeSection={activeSection}
            search={search}
            sort={sort}
            view={view}
            className="w-full max-w-md"
          />
          <div
            className="flex h-10 items-center rounded-md bg-muted p-1"
            role="group"
            aria-label="콘텐츠 정렬"
          >
            <Link
              href={buildSortHref("like")}
              aria-current={sort === "like" ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-sm px-3 text-sm font-medium transition",
                sort === "like"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              인기순
            </Link>
            <Link
              href={buildSortHref("recent")}
              aria-current={sort === "recent" ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-sm px-3 text-sm font-medium transition",
                sort === "recent"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              최신순
            </Link>
          </div>
        </div>

        <Tabs value={activeSection} className="w-full">
          <TabsList className="flex w-fit gap-2 border-0 bg-transparent p-0 shadow-none">
            <TabsTrigger
              value="recipe"
              className="relative -mb-px rounded-t-md rounded-b-none border border-amber-200 bg-amber-100/70 px-4 py-2 text-xs text-slate-600 transition data-[state=active]:border-b-amber-50 data-[state=active]:bg-amber-50 data-[state=active]:text-[18px] data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-none data-[state=inactive]:border-b-transparent data-[state=inactive]:opacity-40"
              asChild
            >
              <Link href={buildSectionHref("recipe")}>레시피</Link>
            </TabsTrigger>

            <TabsTrigger
              value="combo"
              className="relative -mb-px rounded-t-md rounded-b-none border border-amber-200 bg-amber-100/70 px-4 py-2 text-xs text-slate-600 transition data-[state=active]:border-b-amber-50 data-[state=active]:bg-amber-50 data-[state=active]:text-[18px] data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-none data-[state=inactive]:border-b-transparent data-[state=inactive]:opacity-40"
              asChild
            >
              <Link href={buildSectionHref("combo")}>레시피 조합</Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="recipe"
            className="mt-0 border border-amber-200 border-t-0 bg-amber-50 p-4"
          >
            {activeSection === "recipe" ? (
              <RecipeTabContainer
                activeTab={activeTab}
                currentPage={currentPage}
                pageSize={pageSize}
                search={search}
                sort={sort}
                view={view}
                me={another_user}
                showActivityTabs={false}
              />
            ) : null}
          </TabsContent>
          <TabsContent
            value="combo"
            className="mt-0 border border-amber-200 border-t-0 bg-amber-50 p-4"
          >
            {activeSection === "combo" ? (
              <ComboTabContainer
                activeTab={activeTab}
                currentPage={currentPage}
                pageSize={pageSize}
                search={search}
                sort={sort}
                view={view}
                me={another_user}
                showActivityTabs={false}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
