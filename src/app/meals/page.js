"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { Button, Tabs, Tab } from "@heroui/react";
import { Plus } from "lucide-react";

import Gridracipe from "@/component/recipe/display-racipe";
import { listRecipes } from "@/features/recipe/api";

import style from "./page.module.css";

const SORT_OPTIONS = [
  { key: "recent", title: "최신" },
  { key: "like", title: "인기" },
  { key: "check", title: "조회" },
];

export default function MealsPage() {
  const [recipes, setRecipes] = useState([]);
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const [user] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const data = await listRecipes({ limit: 100 });
        const items = (data?.items ?? []).map((item) => ({
          ...item,
          createdAt: item?.createdAt ? new Date(item.createdAt) : null,
          updatedAt: item?.updatedAt ? new Date(item.updatedAt) : null,
        }));
        setRecipes(items);
      } catch (error) {
        console.error("레시피 목록을 불러오지 못했습니다.", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipes();
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

  function handleShare() {
    if (!user) {
      alert("로그인이 필요합니다.");
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
            <p className={style.subtitle}>새로운 요리를 발견하고, 나만의 레시피를 공유해 보세요.</p>
          </div>
          <Button
            color="primary"
            radius="full"
            size="lg"
            startContent={<Plus size={18} />}
            onPress={handleShare}
          >
            레시피 공유하기
          </Button>
        </div>
        <Tabs
          aria-label="레시피 정렬"
          selectedKey={sort}
          onSelectionChange={(key) => setSort(String(key))}
          variant="bordered"
          radius="full"
          color="primary"
        >
          {SORT_OPTIONS.map(({ key, title }) => (
            <Tab key={key} title={title} />
          ))}
        </Tabs>
      </section>

      <section className={style.gridSection}>
        <Gridracipe MealsData={sortedRecipes} loading={loading} />
      </section>
    </div>
  );
}

