import type { ReactNode } from "react";
import styles from "./layout.module.css";

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
    <section className={styles.wrap}>
      {children}
      <div className={styles.columns}>
        <section className={styles.section}>
          <h2 className={styles.title}>레시피</h2>
          {meals}
        </section>
        <section className={styles.section}>
          <h2 className={styles.title}>커뮤니티</h2>
          {posts}
        </section>
      </div>
    </section>
  );
}