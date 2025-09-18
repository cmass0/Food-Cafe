"use client";

import Recipe from "./recipe";
import style from "./display-racipe.module.css";

export default function Gridracipe({ MealsData = [], loading = false }) {
  if (loading) {
    return (
      <div className={style.displaygrid}>
        <p>레시피를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!MealsData.length) {
    return (
      <div className={style.displaygrid}>
        <p>등록된 레시피가 없습니다.</p>
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