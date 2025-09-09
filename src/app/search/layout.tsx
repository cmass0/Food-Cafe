import type { ReactNode } from "react";
import style from "./page.module.css";

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
    <section>
      {children}
      <div>
        <div>{meals}</div>
        <div>{posts}</div>
      </div>
    </section>
  );
}
