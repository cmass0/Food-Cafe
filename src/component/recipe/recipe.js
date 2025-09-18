"use client";

import Image from "next/image";
import style from "./recipe.module.css";
import Link from "next/link";
import { updateRecipe } from "@/features/recipe/api";

export default function Recipe({ data }) {
  async function recipeclickHD(id) {
    try {
      await updateRecipe(id, { viewCountIncrement: true });
    } catch (err) {
      console.error("議고쉶???낅뜲?댄듃???ㅽ뙣?덉뒿?덈떎.", err);
    }
  }

  const likeLabel = data.likeCount ?? data.like ?? 0;
  const viewLabel = data.viewCount ?? data.check ?? 0;
  const writerName = data.writerName ?? data.name ?? "";

  return (
    <div className={style.recipebox}>
      <header className={style.recipeheader}>
        {data.image ? (
          <Image src={data.image} alt="displayed food" fill />
        ) : (
          <div className={style.loadingmsg}>?대?吏媛 議댁옱?섏? ?딆뒿?덈떎.</div>
        )}
      </header>
      <div className={style.recipemain}>
        <div className={style.recipemaincontent}>
          <h3>{data.title}</h3>
          <div>
            <span className={style.creatortext}>Creator</span>: {writerName}
          </div>
          <p>{data.summary}</p>
        </div>
        <div className={style.detailLink}>
          <div className={style.checkandlikebox}>
            <div>議고쉶: {viewLabel}</div>
            <div>醫뗭븘?? {likeLabel}</div>
          </div>

          <Link href={`/meals/${data.id}`} onClick={() => recipeclickHD(data.id)}>
            ?곸꽭蹂닿린
          </Link>
        </div>
      </div>
    </div>
  );
}