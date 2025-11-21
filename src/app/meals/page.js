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

import style from "./page.module.css";

const SORT_OPTIONS = [
  { key: "recent", title: "최신" },
  { key: "like", title: "좋아요" },
  { key: "check", title: "조회" },
];

export default function MealsPage() {
  const [recipes, setRecipes] = useState([]);
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    let mounted = true;

    async function fetchRecipes() {
      try {
        const data = await listRecipes({ limit: 100 });
        const items = (data?.items ?? []).map((item) => ({
          ...item,
          createdAt: item?.createdAt ? new Date(item.createdAt) : null,
          updatedAt: item?.updatedAt ? new Date(item.updatedAt) : null,
        }));
        if (mounted) setRecipes(items);
      } catch (error) {
        console.error("레시피 목록을 가져오는 데 실패했습니다.", error);
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
    if (sort === "check") {
      return base.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    }
    return base.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  }, [recipes, sort]);

  function handleShare(event) {
    event?.preventDefault();
    if (!user) {
      openAuthModal({ next: "/meals/share" });
      return;
    }
    router.push("/meals/share");
  }

  return (
    <div className={style.wrapper}>
      <section className={style.header}>
        <div className={style.headerTop}>
          <div className={style.titleGroup}>
            <h1 className={style.title}>레시피</h1>
            <p className={style.subtitle}>새로운 레시피를 추가하고, 좋아하는 레시피를 발견해 보세요.</p>
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

      <section className={style.gridSection}>
        <Gridracipe MealsData={sortedRecipes} loading={loading} />
      </section>
    </div>
  );
}
