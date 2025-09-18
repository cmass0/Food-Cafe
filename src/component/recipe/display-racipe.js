"use client";

import { Skeleton } from "@heroui/react";
import Recipe from "./recipe";
import style from "./display-racipe.module.css";

export default function Gridracipe({ MealsData = [], loading = false }) {
  if (loading) {
    return (
      <div className={style.displaygrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className={style.cardSkeleton} radius="lg" />
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
        <Recipe key={data.id ?? index} data={data} />
      ))}
    </div>
  );
}

