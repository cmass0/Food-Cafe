"use client";

import Image from "next/image";
import style from "./recipe.module.css";
import Link from "next/link";

export default function Recipe({ data }, id) {
  async function recipeclickHD(id) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            check: "increment",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("check fail");
      }
    } catch (err) {
      console.error("err: ", err);
    }
  }

  return (
    <div className={style.recipebox}>
      <header className={style.recipeheader}>
        {data.image && (
          <Image src={data.image} alt="displayed food" key={id} fill />
        )}
        {data.image && (
          <div className={style.loadingmsg}>이미지가 존재하지 않습니다.</div>
        )}
      </header>
      <div className={style.recipemain}>
        <div className={style.recipemaincontent}>
          <h3>{data.title}</h3>
          <div>
            <span className={style.creatortext}>Creator</span>: {data.name}
          </div>
          <p>{data.summary}</p>
        </div>
        <div className={style.detailLink}>
          <div className={style.checkandlikebox}>
            <div>조회: {data.check}</div>
            <div>좋아요: {data.like}</div>
          </div>

          <Link
            href={`/meals/${data.id}`}
            onClick={() => recipeclickHD(data.id)}
          >
            상세정보
          </Link>
        </div>
      </div>
    </div>
  );
}
