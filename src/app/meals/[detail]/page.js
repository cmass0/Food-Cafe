"use client";

import Image from "next/image";
import style from "./page.module.css";
import poke from "@/assets/poke.jpeg";
import like from "@/assets/like.png";
import btn from "@/assets/right.png";
import CommentArea from "@/component/comment/comment";
import { useEffect, useState } from "react";
import { async } from "@firebase/util";
import { usePathname, useRouter } from "next/navigation";
import LoadingPage from "@/app/loading";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth, db } from "@/data/firestore";
import Modal from "@/component/modal/modal";
import { fetchUser } from "@/data/user";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";

async function alreadyclick(userid, recipeid, detailinfo) {
  const userref = doc(db, "User", userid);
  const reciperef = doc(db, "Recipe", recipeid);

  const userdoc = await getDoc(userref);
  const userData = userdoc.data();

  if (userData.likerecipe && userData.likerecipe.includes(recipeid)) {
    return { message: "좋아요를 누른 레시피입니다.", pass: false };
  }

  await updateDoc(userref, {
    likerecipe: arrayUnion(recipeid),
  });

  return { pass: true };
}

export default async function SomethingMealspage({ params }) {
  const [detailinfo, setDetailInfo] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isModal, setIsModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [confirmtext, setConfirmText] = useState("");
  const [btnconfirmtext, setBtnConfirmText] = useState("");
  const router = useRouter();

  const [user] = useAuthState(Auth);

  useEffect(() => {
    if (user) {
      console.log(user.uid);
      const loginIdentifier = user.providerData[0]?.providerId;
      async function ReadUserData() {
        if (loginIdentifier === "password") {
          const profile = await fetchUser(user.uid);
          console.log(profile);

          if (profile) {
            setUserName(profile.username);
          }
        } else {
          setUserName(user.displayName || "user");
        }
      }
      ReadUserData();
    }
  }, [user]);

  function editHD(e) {
    router.push(`/meals/${params.detail}/recipeedit`);
  }
  function updateHD(e) {
    e.preventDefault();
    setBtnConfirmText("수정");
    setIsModal(true);
    setConfirmText("정말로 수정하시겠습니까?");
  }

  function deleteHD() {
    setBtnConfirmText("삭제");
    setIsModal(true);
    setConfirmText("정말로 삭제하시겠습니까?");
  }

  async function deleteokHD() {
    setIsModal(false);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe/${params.detail}`,
      {
        method: "delete",
        body: JSON.stringify({
          id: params.detail,
        }),
        cache: "no-store",
      }
    );
    console.log(response);
    router.push("/meals");
  }

  useEffect(() => {
    const fetchMeals = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe/${params.detail}`,
        {
          cache: "no-store",
        }
      );

      const responseobj = await response.json();
      const detailinfo = responseobj.data;
      setDetailInfo(detailinfo);

      setLikeCount(detailinfo.like);
    };

    fetchMeals();
  }, [params.detail]);

  // console.log(detailinfo);

  if (!detailinfo) {
    return <LoadingPage />;
  }

  const mealsrecipe = detailinfo.recipe.replace(/\n/g, "<p/>");

  // 좋아요 업데이트
  async function LikeBtnHD(event) {
    event.stopPropagation();

    const likebtnres = await alreadyclick(user.uid, params.detail, detailinfo);

    if (likebtnres.pass) {
      const updatelike = {
        ...detailinfo,
        like: likeCount + 1,
        lastlike: new Date().toISOString(),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe/${params.detail}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatelike),
          cache: "no-store",
        }
      );

      if (response.ok) {
        setLikeCount((prev) => prev + 1);
      } else {
        console.error("좋아요 업데이트 실패 ");
      }
    } else {
      alert(likebtnres.message);
    }
  }

  function onclose() {
    setIsModal(false);
  }

  return (
    <div className={style.detailcontainer}>
      <header className={style.header}>
        <div className={style.image}>
          <Image src={detailinfo.image} fill />
        </div>
        <div className={style.headerText}>
          <h1>{detailinfo.title}</h1>
          {/* <div>{mealID}</div> */}
          <p className={style.creator}>
            by<span> {detailinfo.name}</span>
          </p>
          <p className={style.summary}>{detailinfo.summary}</p>
        </div>
      </header>
      <main className={style.main}>
        <p
          className={style.instructions}
          dangerouslySetInnerHTML={{
            __html: mealsrecipe,
          }}
        ></p>
      </main>

      <div className={style.likebox}>
        {detailinfo.name === userName && (
          <div className={style.btnarea}>
            <button onClick={updateHD}>레시피 수정</button>
            <button onClick={deleteHD}>레시피 삭제</button>
          </div>
        )}
        {user && (
          <div className={style.btntextbox}>
            <div className={style.likeimgbox}>
              <Image src={like} fill alt="like" />
            </div>
            <div className={style.likeform}>
              <button
                className={style.likebtn}
                type="button"
                onClick={LikeBtnHD}
              >
                like
              </button>
            </div>
            <div className={style.likecount}>{likeCount}</div>
          </div>
        )}
      </div>
      {isModal && (
        <Modal onclose={onclose}>
          <div className={style.requirelogin}>
            <button className={style.modalclosebtn} onClick={onclose}>
              X
            </button>
            <div className={style.modaltext}>{confirmtext}</div>
            <div className={style.deletebtnbox}>
              {btnconfirmtext === "삭제" && (
                <button className={style.deleteselectbtn} onClick={deleteokHD}>
                  {btnconfirmtext}
                </button>
              )}
              {btnconfirmtext === "수정" && (
                <button className={style.deleteselectbtn} onClick={editHD}>
                  {btnconfirmtext}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
      <CommentArea type={params.detail} />
    </div>
  );
}
