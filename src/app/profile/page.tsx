import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as userService from "@/domain/user/service";
import { User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProfileSearchForm from "./ProfileSearchForm";
import EditSheet from "./edit/EditSheet";
import ComboTabContainer from "./profiletab/combo/ComboTabContainer";
import RecipeTabContainer from "./profiletab/recipe/RecipeTabContainer";

export const dynamic = "force-dynamic";

type ProfileSearchParams = {
  tab?: string | string[];
  page?: string | string[];
  search?: string | string[];
  section?: string | string[];
};

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return undefined;
}

export default async function ProfilePage(
  props: {
    searchParams?: Promise<ProfileSearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const me = await userService.getSelf();
  if (!me) {
    return notFound();
  }

  const tabParam = normalizeParam(searchParams?.tab);
  const activeTab = tabParam === "bookmark" || tabParam === "like" ? tabParam : "written";
  const sectionParam = normalizeParam(searchParams?.section);
  const activeSection = sectionParam === "combo" ? "combo" : "recipe";
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
            <div className="-mt-5 flex items-end justify-between">
              <div className="flex items-end gap-4">
                <Avatar className="h-20 w-20 border bg-background md:h-24 md:w-24">
                  {me.photo_url ? <AvatarImage src={me.photo_url} alt="프로필 이미지" /> : <User />}
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-2xl font-semibold">{me.display_name ?? "-"}</div>
                  <div className="text-gray-500">{me.email ?? "-"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    팔로워 {me.follower_count ?? 0}
                    <span className="mx-2" aria-hidden="true">
                      ·
                    </span>
                    팔로잉 {me.following_count ?? 0}
                  </div>
                </div>
              </div>
              <EditSheet userProfile={me} />
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-between rounded-2xl border-1.5 px-1.5 pb-2 pt-2">
          <ProfileSearchForm
            activeTab={activeTab}
            activeSection={activeSection}
            search={search}
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

        {/* 최상단 탭 */}
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
              me={me}
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
              me={me}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}


