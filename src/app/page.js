"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import SlideShow from "@/component/main-slide";
import FooterSlide from "@/component/footer/footer-slide";
import { useAuth } from "./auth/auth-context";
import { useAuthModal } from "@/features/auth/ui/AuthModalProvider";

import style from "./page.module.css";

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
              <span>맛있는</span> 레시피
            </h1>

            <h1 className={style.highlight2}>
              건강한 <span>한 끼</span>
            </h1>
            <h1 className={style.highlight3}>Only for you</h1>
            <div className={style["main-headerbtnarea"]}>
              <Button
                className={style["main-headerbtn-primary"]}
                onClick={() => handleCta("/posts")}
              >
                커뮤니티 참여하기
              </Button>

              <Button
                variant="outline"
                className={style["main-headerbtn-secondary"]}
                onClick={() => handleCta("/meals/share")}
              >
                레시피 공유하기
              </Button>
            </div>
          </span>
        </header>
      </section>

      <section className={style.mainsection}>
        <main className={style.main}>
          <section className={style.section}>
            <h2>Welcome!</h2>
            <p>
              Food Cafe는 요리를 즐기고 좋아하는 여러분을 위한 최고의 레시피 공유 커뮤니티입니다.
              다양한 레시피를 서로 공유하고 받아가며 함께 즐거운 식탁을 만들어 보세요.
            </p>
            <p>
              Food Cafe에서 각자의 경험을 공유하고 서로 배우면서 더 풍성한 요리를 만들어갑니다. 초보부터
              베테랑까지 모두 환영이에요. 지금 바로 함께해 보세요.
            </p>
          </section>

          <section className={style.section}>
            <h2>커뮤니티에서는 무엇을 하나요?</h2>
            <p>
              나만의 레시피를 공유하고, 다른 사람들의 레시피를 참고해 보세요. 질문과 답변을 나누고, 함께
              새로운 조합을 시도해 볼 수도 있어요.
            </p>
            <p>
              일상의 소소한 식사부터 특별한 날의 한 상까지, 다양한 경험을 공유하며 더 즐거운 요리 시간을
              만들어 봅시다.
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

