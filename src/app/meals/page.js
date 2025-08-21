"use client";

import Gridracipe from "@/component/recipe/display-racipe";
import style from "./page.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";

async function fetchRecipeApicall() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe`,
    {
      cache: "no-store",
    }
  );
  return response.json();
}

export default function MealsPage() {
  const [recipedata, setRecipeData] = useState([]);
  const [sort, setSort] = useState("recent");
  const auth = getAuth();
  const [user] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    async function fetchRecipedata() {
      const response = await fetchRecipeApicall();
      if (sort === "recent") {
        const sortedarr = response.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setRecipeData(sortedarr);
      }
      if (sort === "like") {
        const sortedarr = response.data.sort((a, b) => b.like - a.like);
        setRecipeData(sortedarr);
      }

      if (sort === "check") {
        const sortedarr = response.data.sort((a, b) => b.check - a.check);
        setRecipeData(sortedarr);
      }
      setRecipeData(response);
    }
    fetchRecipedata();
  }, [sort]);

  function sharelinkHD() {
    if (!user) {
      alert("로그인이 필요한 서비스입니다.");
      return;
    } else {
      router.push("/meals/share");
    }
  }

  return (
    <div className={style.MealsArea}>
      <header className={style.displayheader}>
        <p>자신의 레시피를 사람들과 공유해보세요</p>
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
          <Gridracipe MealsData={recipedata} />
        </div>
      </main>
    </div>
  );
}
