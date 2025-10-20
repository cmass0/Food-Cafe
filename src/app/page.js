"use client";

import style from "./page.module.css";
import Link from "next/link";
import SlideShow from "@/component/main-slide";
import FooterSlide from "@/component/footer/footer-slide";

import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import { Button, ButtonGroup } from "@heroui/react";

export default function Home() {
  const [user] = useAuthState(auth);
  const router = useRouter();

  function shareHD() {
    if (!user) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/auth/signin-signup");
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
              <button className={style["main-headerbtn"]} onClick={shareHD}>
                커뮤니티 참여하기
              </button>

              <button className={style["main-headerbtn"]} onClick={shareHD}>
                음식 공유하기
              </button>
            </div>
          </span>
        </header>
      </section>

      <section className={style.mainsection}>
        <main className={style.main}>
          <section className={style.section}>
            <h2>Welcome!</h2>
            <p>
              Food Cafe는 요리를 즐기고 좋아하는 여러분들을 위한 최고의 레시피 공유 커뮤니티입니다.
              많은 사람들의 레시피를 공유하고 요리에 대한 접근성을 높이기 위해 이 사이트를 만들게 되었습니다.
            </p>
            <p>
              Food Cafe에서는 전 세계 수많은 음식의 레시피를 함께 공유하고 찾아볼 수 있습니다. 서로의
              요리에 대한 아이디어를 주고받을 수 있습니다. 요리에 처음 입문했더라도 괜찮습니다. 이곳에서
              하나씩 배워 가며 실력을 키워 보세요. 초보자도 언제나 환영합니다!
            </p>
          </section>

          <section className={style.section}>
            <h2>이 사이트를 활용하는 법</h2>
            <p>
              요리를 취미로 즐기고 싶나요? 많은 사람들과 아이디어를 공유하고 더 즐겁게 요리할 수 있을 것입니다.
              갑작스럽게 요리가 필요하다면 Food Cafe의 믿을 수 있는 레시피를 참고해 쉽고 빠르게 요리를 완성해 보세요.
            </p>
            <p>
              요리를 직업으로 삼고 싶은가요? 레시피를 공유하고 전 세계 사용자들에게 피드백을 받아보세요.
              분명 더 탄탄한 실력자로 성장할 수 있을 거예요.
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
