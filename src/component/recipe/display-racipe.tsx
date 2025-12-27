"use client";

import Skeleton from "@/components/ui/skeleton";
import { Recipe } from "@/domain/recipe/types";
import style from "./display-racipe.module.css";
import RecipeCard from "./recipe";

type GridracipeProps = {
  MealsData: Recipe[];
  loading: boolean;
};

export default function Gridracipe({ MealsData = [], loading = false }: GridracipeProps) {
  if (loading) {
    return (
      <div className={style.displaygrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className={style.cardSkeleton} />
        ))}
      </div>
    );
  }

  if (!MealsData.length) {
    return (
      <div className={style.emptyState}>
        <h3 className={style.emptyTitle}>등록된 레시피가 없습니다.</h3>
        <p className={style.emptyDescription}>새로운 요리를 공유해 Food Cafe를 채워 보세요.</p>
      </div>
    );
  }

  return (
    <div className={style.displaygrid}>
      {MealsData.map((data, index) => (
        <RecipeCard key={data.id ?? index} data={data} />
      ))}
    </div>
  );
}
