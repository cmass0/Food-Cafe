"use client";

import Image from "next/image";
import style from "./page.module.css";
import Link from "next/link";
import SlideShow from "@/component/main-slide";
import FooterSlide from "@/component/footer/footer-slide";

import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth } from "@/data/firestore";

export default function Home() {
  const [user] = useAuthState(Auth);
  const router = useRouter();

  function shareHD() {
    if (!user) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/login");
    } else {
      router.push("/meals/share");
    }
  }
  return (
    <div className={style.maincontainer}>
      <section>
        <header className={style.header}>
          <span className={style.slide}>
            <SlideShow />
          </span>
          <span>
            <h1 className={style.highlight1}>
              요리하는 <span>즐거움</span>
            </h1>

            <h1 className={style.highlight2}>
              <span>건강한</span> 식습관
            </h1>
            <h1 className={style.highlight3}>ONLY FOR YOU</h1>
            <div className={style["main-headerbtnarea"]}>
              <Link href="/commu">
                <button className={style["main-headerbtn"]}>
                  커뮤니티에 참여하기
                </button>
              </Link>

              <button className={style["main-headerbtn"]} onClick={shareHD}>
                음식 공유하기
              </button>
            </div>
          </span>
        </header>
      </section>
      <section className={style.mainsection}>
        <main className={`${style.main}`}>
          <section className={style.section}>
            <h2>Welcome!</h2>

            <p>
              Food Cafe는 요리를 즐기고 좋아하는 여러분들을 위한 최고의 레시피
              공유 커뮤니티 입니다. 많은 사람들의 레시피를 공유하고 요리에 대한
              접근성을 높이기 위해 이 사이트를 만들게 되었습니다.
            </p>

            <p>
              Food Cafe에서는 전세계 수많은 음식의 레시피를 공유하고 찾아볼 수
              있습니다. 서로의 요리에대한 아이디어를 주고 받을 수 있습니다.
              자신이 초보자라도 상관없습니다. 이 곳에서 더욱 배워갈 수
              있을겁니다. 초보자는 언제나 환영합니다!
            </p>
          </section>
          <section className={style.section}>
            <h2>이 사이트를 활용하는 법</h2>
            <p>
              요리를 취미로 즐기고 싶나요? 많은 사람들과 자신의 아이디어를
              공유할 수 있고 요리를 더욱 재밌게 즐길 수 있을겁니다. 혹은
              갑작스럽게 요리를 해야하는 상황인 경우 Food Cafe의 믿을 수 있는
              레시피를 참고하면 쉽고 빠르게 요리를 만들 수 있을겁니다.
            </p>
            <p>
              요리를 직업으로 삼고 싶으신 생각이있으신가요? 레시피를 공유하고
              전세계 많으사람들로 부터 피드백을 받아보세요. 분명 더욱 견고한
              실력자로 성장하실겁니다.
            </p>
          </section>
        </main>
      </section>

      <section className={style.mainfooter}>
        <FooterSlide className={style.footerslide} />
      </section>

      {/* <section>
        <footer className={style.footer}></footer>
      </section> */}
    </div>
  );
}
