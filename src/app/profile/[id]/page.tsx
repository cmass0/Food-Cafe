import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as userFollowService from "@/domain/follow/service";
import ProfileFollowHeader from "@/domain/follow/ui/ProfileFollowHeader";
import * as userService from "@/domain/user/service";

import { getServerSupabase } from "@/lib/supabase/server";
import ProfileSearchForm from "../ProfileSearchForm";
import ComboTabContainer from "../profiletab/combo/ComboTabContainer";
import RecipeTabContainer from "../profiletab/recipe/RecipeTabContainer";
import {
  normalizeProfileSection,
  normalizeProfileSort,
  normalizeProfileTab,
  normalizeProfileView,
} from "../profile-types";

export const dynamic = "force-dynamic";

type ProfileSearchParams = {
  tab?: string | string[];
  page?: string | string[];
  search?: string | string[];
  email?: string | string[];
  section?: string | string[];
  sort?: string | string[];
  view?: string | string[];
};

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return undefined;
}

export default async function ProfilePage(
  props: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<ProfileSearchParams>;
  }
) {
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

  if (searchParams?.email === "changed") {
    alert("이메일이 변경되었습니다. 변경된 이메일로 로그인해 주세요.");
  }

  const isSelf = viewer?.id === another_user.id;
  let isFollowing = false;

  if (viewer && !isSelf) {
    isFollowing = await userFollowService.checkIsFollowing(supabase, viewer.id, another_user.id);
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

  return (
    <main className="pt-[50px] pb-[50px]">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 md:px-6">
        <Card className="w-full min-h-[200px] overflow-hidden">
          <div className="h-[100px] bg-gradient-to-r from-green-200 to-green-600 md:h-[110px]" />
          <CardContent className="pt-0">
            <ProfileFollowHeader
              targetUserId={another_user.id}
              displayName={another_user.display_name ?? null}
              email={another_user.email ?? null}
              photoUrl={another_user.photo_url ?? null}
              initialIsFollowing={isFollowing}
              initialFollowerCount={another_user?.follower_count ?? 0}
              initialFollowingCount={another_user?.following_count ?? 0}
              canFollow={Boolean(viewer)}
              showButton={!isSelf}
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
          <Tabs defaultValue="popular">
            <TabsList className="h-full">
              <TabsTrigger value="popular">인기순</TabsTrigger>
              <TabsTrigger value="recent">최신순</TabsTrigger>
            </TabsList>
            <TabsContent value="popular"></TabsContent>
            <TabsContent value="recent"></TabsContent>
          </Tabs>
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
            <RecipeTabContainer
              activeTab={activeTab as "written" | "bookmark" | "like"}
              currentPage={currentPage}
              pageSize={pageSize}
              search={search}
              sort={sort}
              view={view}
              me={another_user}
            />
          </TabsContent>
          <TabsContent
            value="combo"
            className="mt-0 border border-amber-200 border-t-0 bg-amber-50 p-4"
          >
            <ComboTabContainer
              activeTab={activeTab as "written" | "bookmark" | "like"}
              currentPage={currentPage}
              pageSize={pageSize}
              search={search}
              sort={sort}
              view={view}
              me={another_user}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
