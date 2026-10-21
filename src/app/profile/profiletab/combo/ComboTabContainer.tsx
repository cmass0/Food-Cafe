import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProfileRow } from "@/domain/user/types";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import ProfileListSkeleton from "../../ProfileListSkeleton";
import type { ProfileSort, ProfileView } from "../../profile-types";
import ProfileComboTab from "./ProfileComboTab";

type Props = {
  activeTab: "written" | "bookmark" | "like";
  currentPage: number;
  pageSize: number;
  search?: string;
  sort?: ProfileSort;
  view?: ProfileView;
  me: ProfileRow;
  /** 보고 있는 사용자. 이미 알면 넘겨서 로그인 확인 요청을 아낀다(null은 비로그인). */
  viewerId?: string | null;
  toolbar?: ReactNode;
  showActivityTabs?: boolean;
};

const tabTriggerClass =
  "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-5 pt-1 text-base font-semibold text-zinc-500 shadow-none transition-none data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:shadow-none";

export default function ComboTabContainer({
  activeTab,
  currentPage,
  pageSize,
  search,
  sort = "recent",
  view = "grid",
  me,
  viewerId,
  toolbar,
  showActivityTabs = true,
}: Props) {
  function buildTabHref(tab: string, searchValue?: string) {
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("section", "combo");
    params.set("sort", sort);
    params.set("view", view);
    if (searchValue) {
      params.set("search", searchValue);
    }
    return `?${params.toString()}`;
  }

  // 조건이 바뀔 때마다 목록 자리를 새로 기다리게 해, 이전 목록에 멈춰 있지 않고 뼈대 화면을 바로 보여 준다.
  const listKey = [activeTab, currentPage, search ?? "", sort, view].join("|");
  const fallback = <ProfileListSkeleton view={view} />;

  return (
    <div>
      <Tabs value={activeTab}>
        {/* 공개 프로필은 작성 목록 하나뿐이라, 항목 하나짜리 탭 줄을 그리지 않는다. */}
        {showActivityTabs ? (
          <TabsList className="flex h-auto w-full justify-start gap-8 rounded-none border-b border-zinc-200 bg-transparent p-0">
            <TabsTrigger value="written" className={tabTriggerClass} asChild>
              <Link href={buildTabHref("written", search)}>작성 조합</Link>
            </TabsTrigger>
            <TabsTrigger value="bookmark" className={tabTriggerClass} asChild>
              <Link href={buildTabHref("bookmark", search)}>북마크</Link>
            </TabsTrigger>
            <TabsTrigger value="like" className={tabTriggerClass} asChild>
              <Link href={buildTabHref("like", search)}>좋아요</Link>
            </TabsTrigger>
          </TabsList>
        ) : null}
        {toolbar}
        <TabsContent value="written" className="mt-8">
          {activeTab === "written" ? (
            <Suspense key={listKey} fallback={fallback}>
              <ProfileComboTab
                type="written"
                page={currentPage}
                limit={pageSize}
                search={search}
                sort={sort}
                view={view}
                id={me.id}
                viewerId={viewerId}
              />
            </Suspense>
          ) : null}
        </TabsContent>
        {showActivityTabs ? (
          <>
            <TabsContent value="bookmark" className="mt-8">
              {activeTab === "bookmark" ? (
                <Suspense key={listKey} fallback={fallback}>
                  <ProfileComboTab
                    type="bookmark"
                    page={currentPage}
                    limit={pageSize}
                    search={search}
                    sort={sort}
                    view={view}
                    id={me.id}
                    viewerId={viewerId}
                  />
                </Suspense>
              ) : null}
            </TabsContent>
            <TabsContent value="like" className="mt-8">
              {activeTab === "like" ? (
                <Suspense key={listKey} fallback={fallback}>
                  <ProfileComboTab
                    type="like"
                    page={currentPage}
                    limit={pageSize}
                    search={search}
                    sort={sort}
                    view={view}
                    id={me.id}
                    viewerId={viewerId}
                  />
                </Suspense>
              ) : null}
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}
