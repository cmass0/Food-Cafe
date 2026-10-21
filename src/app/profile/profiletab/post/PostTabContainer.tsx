import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import ProfileListSkeleton from "../../ProfileListSkeleton";
import type { ProfileSort, ProfileTab, ProfileView } from "../../profile-types";
import ProfilePostTab from "./ProfilePostTab";

type Props = {
  activeTab: ProfileTab;
  currentPage: number;
  pageSize: number;
  userId: string;
  search?: string;
  sort?: ProfileSort;
  view?: ProfileView;
  toolbar?: ReactNode;
};

const tabTriggerClass =
  "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-5 pt-1 text-base font-semibold text-zinc-500 shadow-none transition-none data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:shadow-none";

export default function PostTabContainer({
  activeTab,
  currentPage,
  pageSize,
  userId,
  search,
  sort = "recent",
  view = "grid",
  toolbar,
}: Props) {
  function buildTabHref(tab: ProfileTab) {
    const params = new URLSearchParams({ section: "post", tab, sort, view });
    if (search) params.set("search", search);
    return `?${params.toString()}`;
  }

  return (
    <Tabs value={activeTab}>
      <TabsList className="flex h-auto w-full justify-start gap-8 rounded-none border-b border-zinc-200 bg-transparent p-0">
        <TabsTrigger value="written" className={tabTriggerClass} asChild>
          <Link href={buildTabHref("written")}>작성 게시글</Link>
        </TabsTrigger>
        <TabsTrigger value="bookmark" className={tabTriggerClass} asChild>
          <Link href={buildTabHref("bookmark")}>북마크</Link>
        </TabsTrigger>
        <TabsTrigger value="like" className={tabTriggerClass} asChild>
          <Link href={buildTabHref("like")}>좋아요</Link>
        </TabsTrigger>
      </TabsList>
      {toolbar}
      {(["written", "bookmark", "like"] as const).map((tab) => (
        <TabsContent key={tab} value={tab} className="mt-8">
          {activeTab === tab ? (
            // 조건이 바뀔 때마다 목록 자리를 새로 기다리게 해, 이전 목록에 멈춰 있지 않고 뼈대 화면을 바로 보여 준다.
            <Suspense
              key={[tab, currentPage, search ?? "", sort, view].join("|")}
              fallback={<ProfileListSkeleton view={view} />}
            >
              <ProfilePostTab
                type={tab}
                userId={userId}
                page={currentPage}
                limit={pageSize}
                search={search}
                sort={sort}
                view={view}
              />
            </Suspense>
          ) : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}
