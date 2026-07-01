import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRow } from "@/domain/user/types";
import Link from "next/link";
import type { ReactNode } from "react";

import type { ProfileSort, ProfileView } from "../../profile-types";
import ProfileComboTab from "./ProfileComboTab";

type Props = {
  activeTab: "written" | "bookmark" | "like";
  currentPage: number;
  pageSize: number;
  search?: string;
  sort?: ProfileSort;
  view?: ProfileView;
  me: UserRow;
  toolbar?: ReactNode;
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
  toolbar,
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

  return (
    <div>
      <Tabs value={activeTab}>
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
        {toolbar}
        <TabsContent value="written" className="mt-8">
          {activeTab === "written" ? (
            <ProfileComboTab
              type="written"
              page={currentPage}
              limit={pageSize}
              search={search}
              sort={sort}
              view={view}
              id={me.id}
            />
          ) : null}
        </TabsContent>
        <TabsContent value="bookmark" className="mt-8">
          {activeTab === "bookmark" ? (
            <ProfileComboTab
              type="bookmark"
              page={currentPage}
              limit={pageSize}
              search={search}
              sort={sort}
              view={view}
              id={me.id}
            />
          ) : null}
        </TabsContent>
        <TabsContent value="like" className="mt-8">
          {activeTab === "like" ? (
            <ProfileComboTab
              type="like"
              page={currentPage}
              limit={pageSize}
              search={search}
              sort={sort}
              view={view}
              id={me.id}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
