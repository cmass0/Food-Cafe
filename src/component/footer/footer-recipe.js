"use client";
import Image from "next/image";
import style from "./footer-recipe.module.css";
import Link from "next/link";

export default function FooterRecipe({ data, index, curindex }) {
  return (
    <div
      style={{
        opacity: curindex === index ? 1 : 0,
        pointerEvents: curindex === index ? "auto" : "none",
      }}
      className={style.footerslidebox}
    >
      <header className={style.recipeheader}>
        <Image src={data.image} alt="displayed food" key={index} fill />
      </header>
      <main>
        <div className={style.recipemain}>
          <div className={style.recipemaincontent}>
            <h1>{data.title}</h1>
            <div>
              <span className={style.creatortext}>Creator</span> : {data.name}
            </div>
            <p>{data.summary}</p>
          </div>
          <div className={style.detailLink}>
            <Link href={`/meals/${data.id}`}>상세정보</Link>
          </div>
        </div>
      </main>
      <div>
        {/* <button className={style.rightbtn} onClick={rightaction}></button> */}
      </div>
    </div>
  );
}
