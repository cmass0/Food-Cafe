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
      alert("ë¡œê·¸?¸ì´ ?„ìš”???œë¹„?¤ì…?ˆë‹¤.");
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
              ?”ë¦¬?˜ëŠ” <span>ì¦ê±°?€</span>
            </h1>

            <h1 className={style.highlight2}>
              <span>ê±´ê°•??/span> ?ìŠµê´€
            </h1>
            <h1 className={style.highlight3}>ONLY FOR YOU</h1>
            <div className={style["main-headerbtnarea"]}>
              <button className={style["main-headerbtn"]} onClick={shareHD}>
                ì»¤ë??ˆí‹° ì°¸ì—¬?˜ê¸°
              </button>

              <button className={style["main-headerbtn"]} onClick={shareHD}>
                ?Œì‹ ê³µìœ ?˜ê¸°
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
              Food Cafe???”ë¦¬ë¥?ì¦ê¸°ê³?ì¢‹ì•„?˜ëŠ” ?¬ëŸ¬ë¶„ë“¤???„í•œ ìµœê³ ???ˆì‹œ??ê³µìœ  ì»¤ë??ˆí‹° ?…ë‹ˆ??
              ë§ì? ?¬ëŒ?¤ì˜ ?ˆì‹œ?¼ë? ê³µìœ ?˜ê³  ?”ë¦¬???€???‘ê·¼?±ì„ ?’ì´ê¸??„í•´ ???¬ì´?¸ë? ë§Œë“¤ê²?
              ?˜ì—ˆ?µë‹ˆ??
            </p>

            <p>
              Food Cafe?ì„œ???„ì„¸ê³??˜ë§?€ ?Œì‹???ˆì‹œ?¼ë? ê³µìœ ?˜ê³  ì°¾ì•„ë³????ˆìŠµ?ˆë‹¤. ?œë¡œ??
              ?”ë¦¬?ë????„ì´?”ì–´ë¥?ì£¼ê³  ë°›ì„ ???ˆìŠµ?ˆë‹¤. ?ì‹ ??ì´ˆë³´?ë¼???ê??†ìŠµ?ˆë‹¤. ??ê³³ì—??
              ?”ìš± ë°°ì›Œê°????ˆì„ê²ë‹ˆ?? ì´ˆë³´?ëŠ” ?¸ì œ???˜ì˜?©ë‹ˆ??
            </p>
          </section>
          <section className={style.section}>
            <h2>???¬ì´?¸ë? ?œìš©?˜ëŠ” ë²?/h2>
            <p>
              ?”ë¦¬ë¥?ì·¨ë?ë¡?ì¦ê¸°ê³??¶ë‚˜?? ë§ì? ?¬ëŒ?¤ê³¼ ?ì‹ ???„ì´?”ì–´ë¥?ê³µìœ ?????ˆê³  ?”ë¦¬ë¥?
              ?”ìš± ?¬ë°Œê²?ì¦ê¸¸ ???ˆì„ê²ë‹ˆ?? ?¹ì? ê°‘ì‘?¤ëŸ½ê²??”ë¦¬ë¥??´ì•¼?˜ëŠ” ?í™©??ê²½ìš° Food
              Cafe??ë¯¿ì„ ???ˆëŠ” ?ˆì‹œ?¼ë? ì°¸ê³ ?˜ë©´ ?½ê³  ë¹ ë¥´ê²??”ë¦¬ë¥?ë§Œë“¤ ???ˆì„ê²ë‹ˆ??
            </p>
            <p>
              ?”ë¦¬ë¥?ì§ì—…?¼ë¡œ ?¼ê³  ?¶ìœ¼???ê°?´ìˆ?¼ì‹ ê°€?? ?ˆì‹œ?¼ë? ê³µìœ ?˜ê³  ?„ì„¸ê³?ë§ìœ¼?¬ëŒ?¤ë¡œ
              ë¶€???¼ë“œë°±ì„ ë°›ì•„ë³´ì„¸?? ë¶„ëª… ?”ìš± ê²¬ê³ ???¤ë ¥?ë¡œ ?±ì¥?˜ì‹¤ê²ë‹ˆ??
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
