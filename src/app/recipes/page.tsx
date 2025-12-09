"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import Gridracipe from "@/component/recipe/display-racipe";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/features/auth/ui/AuthModalProvider";
import { listRecipes } from "@/features/recipe/api";

const SORT_OPTIONS = [
  { key: "recent", title: "최신" },
  { key: "like", title: "좋아요" },
  { key: "view", title: "조회" },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [sort, setSort] = useState<string>("recent");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    let mounted = true;

    async function fetchRecipes() {
      try {
        const data = await listRecipes({ limit: 30, page: 10 });
        const items = (data?.items ?? []).map((item: any) => ({
          ...item,
          createdAt: item?.createdAt ? new Date(item.createdAt) : null,
          updatedAt: item?.updatedAt ? new Date(item.updatedAt) : null,
        }));
        if (mounted) setRecipes(items);
      } catch (error) {
        console.error("레시피 목록을 불러오는데 실패했습니다.", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRecipes();
    return () => {
      mounted = false;
    };
  }, []);

  const sortedRecipes = useMemo(() => {
    const base = [...recipes];
    if (sort === "like") {
      return base.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    }
    if (sort === "view") {
      return base.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    }
    return base.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  }, [recipes, sort]);

  function handleShare(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    if (!user) {
      openAuthModal({ next: "/recipes/new" });
      return;
    }
    router.push("/recipes/new");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">레시피</h1>
            <p className="text-sm text-muted-foreground">
              새 레시피를 공유하고, 좋아요/조회순으로 인기 레시피를 살펴보세요.
            </p>
          </div>
          <Button className="gap-2 rounded-full px-5 py-2 text-base" onClick={handleShare}>
            <Plus className="h-4 w-4" />
            레시피 공유하기
          </Button>
        </div>

        <Tabs value={sort} onValueChange={setSort} className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-3 rounded-full px-1.5 py-1">
            {SORT_OPTIONS.map(({ key, title }) => (
              <TabsTrigger key={key} value={key} className="rounded-full text-sm">
                {title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      <section>
        <Gridracipe MealsData={sortedRecipes} loading={loading} />
      </section>
    </div>
  );
}
