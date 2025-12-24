import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowButton from "@/features/follow/ui/FollowButton";
import * as userService from "@/features/user/service";
import { User } from "lucide-react";

import { getServerSupabase } from "@/lib/supabase/server";
import ProfileRecipeTab from "../profiletab/ProfileRecipeTab";

export const dynamic = "force-dynamic";

type ProfileSearchParams = {
  tab?: string | string[];
  page?: string | string[];
  search?: string | string[];
};

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return undefined;
}

function buildTabHref(tab: string, search?: string) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (search) {
    params.set("search", search);
  }
  return `?${params.toString()}`;
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: ProfileSearchParams;
}) {
  const supabase = getServerSupabase();
  const another_user = await userService.getUserById(params.id);
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  if (!another_user) {
    return (
      <main className="grid gap-4 p-6">
        <p>로그인이 필요합니다.</p>
        <Link href="/auth/signin-signup" className="text-primary underline">
          로그인하러 가기
        </Link>
      </main>
    );
  }

  const isSelf = viewer?.id === another_user.id;
  let isFollowing = false;
  if (viewer && !isSelf) {
    const { data: followRow, error: followError } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", viewer.id)
      .eq("following_id", another_user.id)
      .maybeSingle();
    if (followError) {
      console.error("[profile] follow lookup error:", followError);
    } else {
      isFollowing = Boolean(followRow);
    }
  }

  const tabParam = normalizeParam(searchParams?.tab);
  const activeTab = tabParam === "bookmark" || tabParam === "like" ? tabParam : "written";
  const pageParam = normalizeParam(searchParams?.page);
  const pageNum = pageParam ? Number(pageParam) : 1;
  const currentPage = Number.isFinite(pageNum) && pageNum > 0 ? Math.trunc(pageNum) : 1;
  const searchParam = normalizeParam(searchParams?.search);
  const search = searchParam?.trim() || undefined;
  const pageSize = 6;

  return (
    <main className="pt-[50px] pb-[50px]">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 md:px-6">
        <Card className="w-full min-h-[200px] overflow-hidden">
          <div className="h-[100px] bg-gradient-to-r from-green-200 to-green-600 md:h-[110px]" />
          <CardContent className="pt-0">
            <div className="-mt-9 flex items-end justify-between">
              <div className="flex items-end gap-4">
                <Avatar className="h-20 w-20 border bg-background md:h-24 md:w-24">
                  {another_user.photo_url ? (
                    <AvatarImage src={another_user.photo_url} alt="프로필 이미지" />
                  ) : (
                    <User />
                  )}
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-2xl font-semibold">{another_user.display_name ?? "-"}</div>
                  <div className="text-gray-500">{another_user.email ?? "-"}</div>
                </div>
              </div>
              {!isSelf ? (
                <FollowButton
                  targetUserId={another_user.id}
                  initialIsFollowing={isFollowing}
                  initialFollowerCount={another_user.follower_count ?? 0}
                  followingCount={another_user.following_count ?? 0}
                  canFollow={Boolean(viewer)}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-between rounded-2xl border-1.5 px-1.5 pb-2 pt-2">
          <form method="get" className="w-[30%]">
            <input type="hidden" name="tab" value={activeTab} />
            <Input
              name="search"
              className="rounded-2xl bg-amber-50"
              placeholder="검색: 레시피/태그"
              defaultValue={search ?? ""}
            />
          </form>
          <Tabs defaultValue="popular">
            <TabsList className="h-full">
              <TabsTrigger value="popular">인기순</TabsTrigger>
              <TabsTrigger value="recent">최신순</TabsTrigger>
            </TabsList>
            <TabsContent value="popular"></TabsContent>
            <TabsContent value="recent"></TabsContent>
          </Tabs>
        </div>

        <div className="pt-6">
          <Tabs defaultValue={activeTab}>
            <TabsList className="h-full">
              <TabsTrigger value="written" asChild>
                <Link href={buildTabHref("written", search)}>작성 레시피</Link>
              </TabsTrigger>
              <TabsTrigger value="bookmark" asChild>
                <Link href={buildTabHref("bookmark", search)}>북마크</Link>
              </TabsTrigger>
              <TabsTrigger value="like" asChild>
                <Link href={buildTabHref("like", search)}>좋아요</Link>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="written">
              <ProfileRecipeTab
                type="written"
                page={activeTab === "written" ? currentPage : 1}
                limit={pageSize}
                search={search}
                id={another_user.id}
              />
            </TabsContent>
            <TabsContent value="bookmark">
              <ProfileRecipeTab
                type="bookmark"
                page={activeTab === "bookmark" ? currentPage : 1}
                limit={pageSize}
                search={search}
                id={another_user.id}
              />
            </TabsContent>
            <TabsContent value="like">
              <ProfileRecipeTab
                type="like"
                page={activeTab === "like" ? currentPage : 1}
                limit={pageSize}
                search={search}
                id={another_user.id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
