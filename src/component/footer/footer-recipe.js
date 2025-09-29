"use client";
import Image from "next/image";
import style from "./footer-recipe.module.css";
import Link from "next/link";

export default function FooterRecipe({ data, index, curindex }) {
  const writerName = data.writerName ?? data.name ?? "";
  return (
    <div
      style={{
        opacity: curindex === index ? 1 : 0,
        pointerEvents: curindex === index ? "auto" : "none",
      }}
      className={style.footerslidebox}
    >
      <header className={style.recipeheader}>
        {data.image && <Image src={data.image} alt="displayed food" fill />}
      </header>
      <main>
        <div className={style.recipemain}>
          <div className={style.recipemaincontent}>
            <h1>{data.title}</h1>
            <div>
              <span className={style.creatortext}>Creator</span> : {writerName}
            </div>
            <p>{data.summary}</p>
          </div>
          <div className={style.detailLink}>
            <Link href={`/meals/${data.id}`}>상세보기</Link>
          </div>
        </div>
      </main>
      <div></div>
    </div>
  );
}