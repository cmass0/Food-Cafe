import Image from "next/image";
import style from "./searchdisplay.module.css";
import Link from "next/link";

export default function SearchDisplay({ contents }) {
  //id, name, creator, explation, image, tye
  //number, title, writer, date, check, type
  const ismeal = contents.type === "meal";
  const isboard = contents.type === "board";
  console.log(contents);

  if (ismeal) {
    return (
      <section className={style.display}>
        <div className={style.searchimg}>
          <Image src={contents.image} alt={contents.id} fill></Image>
        </div>
        <div className={style.mealsinfocontainer}>
          <h3>{contents.title}</h3>
          <p>
            <span className={style.creatortext}>creator</span>: {contents.name}
          </p>
          <p>{contents.summary}</p>
          <Link href={`/meals/${contents.id}`} className={style.searchdetail}>
            상세정보
          </Link>
        </div>
      </section>
    );
  }

  if (isboard) {
    return (
      <section className={style.display}>
        <div className={style.postcontainer}>
          <Link href={`/commu/${contents.id}`}>
            <h1>{contents.title}</h1>
          </Link>
          <p>작성자: {contents.writer}</p>
          <p>{contents.date.substring(0, 10)}</p>
        </div>
      </section>
    );
  }
}
