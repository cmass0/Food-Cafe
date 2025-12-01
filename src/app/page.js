"use client";

import style from "./page.module.css";
import SlideShow from "@/component/main-slide";
import FooterSlide from "@/component/footer/footer-slide";

import { useRouter } from "next/navigation";
import { useAuth } from "./auth/auth-context";
import { useAuthModal } from "@/features/auth/ui/AuthModalProvider";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleCta = (targetPath) => {
    if (!user) {
      openAuthModal({ next: targetPath });
      return;
    }
    router.push(targetPath);
  };

  return (
    <div className={style.maincontainer}>
      <section>
        <header className={style.header}>
          <span className={style.slide}>
            <SlideShow />
          </span>
          <span>
            <h1 className={style.highlight1}>
              즐거운 <span>레시피</span>
            </h1>

            <h1 className={style.highlight2}>
              <span>건강한</span> 한끼
            </h1>
            <h1 className={style.highlight3}>ONLY FOR YOU</h1>
            <div className={style["main-headerbtnarea"]}>
              <button className={style["main-headerbtn"]} onClick={() => handleCta("/posts")}>
                커뮤니티 참여하기
              </button>

              <button className={style["main-headerbtn"]} onClick={() => handleCta("/meals/share")}>
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
              다양한 레시피와 팁을 공유하고 받아가며 함께 즐거운 요리를 만들어 보세요.
            </p>
            <p>
              Food Cafe에서는 각자의 경험을 공유하고 서로 배우며 더 나은 요리를 만들어갑니다.
              초보자부터 전문가까지 모두 환영합니다. 지금 바로 함께하세요!
            </p>
          </section>

          <section className={style.section}>
            <h2>이 커뮤니티를 활용하는 법</h2>
            <p>
              자신만의 레시피를 공유하거나, 다른 사람들의 레시피를 참고해보세요. 질문을 올리고
              답변을 받으며 요리에 대한 지식을 넓힐 수 있습니다.
            </p>
            <p>
              또한, 레시피 사진과 후기 공유를 통해 더욱 생생한 경험을 나눌 수 있습니다. 여러분의
              이야기를 기다리고 있어요!
            </p>
          </section>
        </main>
      </section>

      <section className={style.mainfooter}>
        <FooterSlide className={style.footerslide} />
      </section>
    </div>
  );
}
