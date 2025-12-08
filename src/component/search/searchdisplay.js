import Image from "next/image";
import Link from "next/link";

import style from "./searchdisplay.module.css";

export default function SearchDisplay({ contents }) {
  const isMeal = contents.type === "meal";
  const isBoard = contents.type === "board";

  if (isMeal) {
    return (
      <section className={style.display}>
        <div className={style.searchimg}>
          <Image src={contents.image} alt={contents.id} fill />
        </div>
        <div className={style.mealsinfocontainer}>
          <h3>{contents.title}</h3>
          <p>
            <span className={style.creatortext}>작성자</span>: {contents.name}
          </p>
          <p>{contents.summary}</p>
          <Link href={`/recipes/${contents.id}`} className={style.searchdetail}>
            자세히 보기
          </Link>
        </div>
      </section>
    );
  }

  if (isBoard) {
    return (
      <section className={style.display}>
        <div className={style.postcontainer}>
          <Link href={`/posts/${contents.id}`}>
            <h1>{contents.title}</h1>
          </Link>
          <p>작성자 {contents.writer}</p>
          <p>{contents.date.substring(0, 10)}</p>
        </div>
      </section>
    );
  }

  return null;
}
