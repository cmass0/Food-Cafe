"use client";

import Image from "next/image";
import style from "./page.module.css";
import like from "@/assets/like.png";
import CommentArea from "@/component/comment/comment";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "@/app/loading";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/client";
import Modal from "@/component/modal/modal";
import { fetchUsernameByUid } from "@/data/fetchuser-client";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { deleteRecipe, getRecipe, updateRecipe } from "@/features/recipe/api";

async function alreadyclick(userid, recipeid) {
  const userref = doc(db, "User", userid);
  const userdoc = await getDoc(userref);
  const userData = userdoc.data();

  if (userData?.likerecipe && userData.likerecipe.includes(recipeid)) {
    return { message: "이미 좋아요를 누른 레시피입니다.", pass: false };
  }

  await updateDoc(userref, {
    likerecipe: arrayUnion(recipeid),
  });

  return { pass: true };
}

export default function SomethingMealspage({ params }) {
  const [detailinfo, setDetailInfo] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isModal, setIsModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [confirmtext, setConfirmText] = useState("");
  const [btnconfirmtext, setBtnConfirmText] = useState("");
  const router = useRouter();

  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) return;
    const loginIdentifier = user.providerData[0]?.providerId;
    async function ReadUserData() {
      if (loginIdentifier === "password") {
        const username = await fetchUsernameByUid(user.uid);
        if (username) {
          setUserName(username);
          return;
        }
      }
      setUserName(user.displayName || "user");
    }
    ReadUserData();
  }, [user]);

  useEffect(() => {
    async function fetchMeals() {
      try {
        const data = await getRecipe(params.detail);
        if (!data) {
          setDetailInfo(null);
          return;
        }
        setDetailInfo({
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : null,
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
        });
        setLikeCount(data.likeCount ?? 0);
      } catch (error) {
        console.error("레시피 상세 조회에 실패했습니다.", error);
      }
    }

    fetchMeals();
  }, [params.detail]);

  function editHD() {
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

    try {
      await deleteRecipe(params.detail);
      router.push("/meals");
    } catch (error) {
      console.error("레시피 삭제에 실패했습니다.", error);
      alert("레시피를 삭제하지 못했습니다.");
    }
  }

  if (!detailinfo) {
    return <LoadingPage />;
  }

  const mealsrecipe = detailinfo.recipe?.replace(/\n/g, "<p/>");

  async function LikeBtnHD(event) {
    event.stopPropagation();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const likebtnres = await alreadyclick(user.uid, params.detail);

    if (likebtnres.pass) {
      try {
        await updateRecipe(params.detail, {
          likeCountIncrement: true,
          lastLikedAt: new Date().toISOString(),
        });
        setLikeCount((prev) => prev + 1);
      } catch (error) {
        console.error("좋아요 업데이트 실패", error);
      }
    } else {
      alert(likebtnres.message);
    }
  }

  function onclose() {
    setIsModal(false);
  }

  const writerName = detailinfo.writerName ?? detailinfo.name ?? "";

  return (
    <div className={style.detailcontainer}>
      <header className={style.header}>
        <div className={style.image}>
          {detailinfo.image ? (
            <Image src={detailinfo.image} fill alt={detailinfo.title || "recipe"} />
          ) : (
            <div className={style.noimage}>이미지가 없습니다.</div>
          )}
        </div>
        <div className={style.headerText}>
          <h1>{detailinfo.title}</h1>
          <p className={style.creator}>
            by<span> {writerName}</span>
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
        {writerName === userName && (
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