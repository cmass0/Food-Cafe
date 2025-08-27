"use client";

import CommentArea from "@/component/comment/comment";
import style from "./page.module.css";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingPage from "@/app/loading";
import { useRouter } from "next/navigation";
import Modal from "@/component/modal/modal";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import { fetchUser } from "@/data/user";

export default function CommuDetailPage({ params }) {
  const [detailinfo, setDetailInfo] = useState(null);
  const [isModal, setIsModal] = useState(false);
  const [confirmtext, setConfirmText] = useState("");
  const [btnconfirmtext, setBtnConfirmText] = useState("");
  const [userName, setUserName] = useState("");

  const router = useRouter();
  const [user] = useAuthState(auth);

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
    router.push(`/commu/${params.commudetail}/editform`);
  }
  function updateHD() {
    setBtnConfirmText("수정");
    setIsModal(true);
    setConfirmText("정말로 수정하시겠습니까?");
  }

  function deleteHD() {
    setBtnConfirmText("삭제");
    setIsModal(true);
    setConfirmText("정말로 삭제하시겠습니까?");
  }

  useEffect(() => {
    const fetchpost = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/post/${params.commudetail}`,
        {
          cache: "no-store",
        }
      );

      const responseonj = await response.json();
      const detailinfo = responseonj.data;
      setDetailInfo(detailinfo);
    };
    fetchpost();
  }, [params.commudetail]);

  async function deleteokHD() {
    setIsModal(false);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/post/${params.commudetail}`,
      {
        method: "delete",
        body: JSON.stringify({
          id: params.commudetail,
        }),
        cache: "no-store",
      }
    );
    console.log(response);
    router.push("/commu");
  }

  function onclose() {
    setIsModal(false);
  }

  if (detailinfo === null) {
    return <LoadingPage></LoadingPage>;
  }

  return (
    <div className={style.postcontainer}>
      <section className={style.BoardSection}>
        <header className={style.BoardHeader}>
          <h2>{detailinfo.title}</h2>
          <div className={style.HeaderInfo}>
            <div>작성자: {detailinfo.writer}</div>
            <div>|</div>

            <div>조회: {detailinfo.check}</div>
            <div>|</div>
            <div>{detailinfo.date.substring(0, 10)}</div>
          </div>
        </header>
        <article className={style.BoardMain}>
          <div dangerouslySetInnerHTML={{ __html: detailinfo.content }} />
        </article>
      </section>
      <div className={style.btnarea}>
        {detailinfo.writer === userName && (
          <>
            <button onClick={updateHD}>수정</button>
            <button onClick={deleteHD}>삭제</button>
          </>
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
      <article className={style.CommentArea}>
        <CommentArea type={params.commudetail} />
      </article>
    </div>
  );
}
