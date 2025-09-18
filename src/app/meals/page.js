"use client";

import Gridracipe from "@/component/recipe/display-racipe";
import style from "./page.module.css";
import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { listRecipes } from "@/features/recipe/api";

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

  function sharelinkHD() {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    router.push("/meals/share");
  }

  return (
    <div className={style.MealsArea}>
      <header className={style.displayheader}>
        <p>당신의 레시피를 사람들과 공유해보세요</p>
        <button onClick={sharelinkHD} className={style.sharebtn}>
          레시피 공유하기{`<<<`}
        </button>
        <div className={style.dropdownbox}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={style.selectbox}
          >
            <option value="recent">최신 순</option>
            <option value="like">좋아요 순</option>
            <option value="check">조회 순</option>
          </select>
        </div>
      </header>

      <main className={style.displaygrid}>
        <div className={style.mainfooterbox}>
          <Gridracipe MealsData={sortedRecipes} loading={loading} />
        </div>
      </main>
    </div>
  );
}