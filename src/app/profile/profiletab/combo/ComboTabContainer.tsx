import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRow } from "@/domain/user/types";
import Link from "next/link";
import ProfileComboTab from "./ProfileComboTab";

type Props = {
  activeTab: "written" | "bookmark" | "like";
  currentPage: number;
  pageSize: number;
  search?: string;
  me: UserRow;
};

export default function ComboTabContainer({
  activeTab,
  currentPage,
  pageSize,
  search,
  me,
}: Props) {
  function buildTabHref(tab: string, searchValue?: string) {
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("section", "combo");
    if (searchValue) {
      params.set("search", searchValue);
    }
    return `?${params.toString()}`;
  }

  return (
    <div className="pt-2">
      <Tabs value={activeTab}>
        <TabsList className="h-full">
          <TabsTrigger value="written" asChild>
            <Link href={buildTabHref("written", search)}>작성 조합</Link>
          </TabsTrigger>
          <TabsTrigger value="bookmark" asChild>
            <Link href={buildTabHref("bookmark", search)}>북마크</Link>
          </TabsTrigger>
          <TabsTrigger value="like" asChild>
            <Link href={buildTabHref("like", search)}>좋아요</Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="written">
          <ProfileComboTab
            type="written"
            page={activeTab === "written" ? currentPage : 1}
            limit={pageSize}
            search={search}
            id={me.id}
          />
        </TabsContent>
        <TabsContent value="bookmark">
          <ProfileComboTab
            type="bookmark"
            page={activeTab === "bookmark" ? currentPage : 1}
            limit={pageSize}
            search={search}
            id={me.id}
          />
        </TabsContent>
        <TabsContent value="like">
          <ProfileComboTab
            type="like"
            page={activeTab === "like" ? currentPage : 1}
            limit={pageSize}
            search={search}
            id={me.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
