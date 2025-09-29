import type { ReactNode } from "react";
import style from "./layout.module.css";

export default function SearchLayout({
  children,
  meals,
  posts,
}: {
  children: ReactNode;
  meals: ReactNode;
  posts: ReactNode;
}) {
  return (
    <section className={style.wrap}>
      <div className={style.columns}>
        <div className={style.section}>{meals}</div>
        <div className={style.section}>{posts}</div>
      </div>
    </section>
  );
}
