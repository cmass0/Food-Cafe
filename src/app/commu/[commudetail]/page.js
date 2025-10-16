"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";

import CommentArea from "@/component/comment/comment";
import Modal from "@/component/modal/modal";
import LoadingPage from "@/app/loading";
import { auth } from "@/lib/firebase/client";
import { fetchUsernameByUid } from "@/features/user/client";
import { deletePost, getPost } from "@/features/post/api";

import style from "./page.module.css";

function formatDate(value) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toISOString().slice(0, 10);
}

export default function CommuDetailPage({ params }) {
  const [detail, setDetail] = useState(null);
  const [isModal, setIsModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [userName, setUserName] = useState("user");

  const router = useRouter();
  const [user] = useAuthState(auth);

  useEffect(() => {
    let cancelled = false;

    async function resolveDisplayName() {
      if (!user) {
        setUserName("user");
        return;
      }

      const prefersPassword = user.providerData?.some((p) => p?.providerId === "password");
      if (!prefersPassword) {
        setUserName(user.displayName ?? "user");
        return;
      }

      try {
        const name = await fetchUsernameByUid(user.uid);
        if (!cancelled) setUserName(name ?? user.displayName ?? "user");
      } catch {
        if (!cancelled) setUserName(user.displayName ?? "user");
      }
    }

    resolveDisplayName();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      try {
        const data = await getPost(params.commudetail);
        if (!cancelled) setDetail(data);
      } catch (error) {
        console.error("Failed to load post", error);
        if (!cancelled) setDetail(undefined);
      }
    }

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [params.commudetail]);

  const isAuthor = useMemo(() => {
    if (!detail) return false;
    const writer = detail.writerName ?? detail.writer ?? "";
    return writer === userName;
  }, [detail, userName]);

  function goToEdit() {
    router.push(`/commu/${params.commudetail}/editform`);
  }

  function handleEditConfirm() {
    setIsModal(false);
    goToEdit();
  }

  function confirmEdit() {
    setConfirmText("게시글을 수정하시겠습니까?");
    setConfirmAction(() => handleEditConfirm);
    setIsModal(true);
  }

  function confirmDelete() {
    setConfirmText("게시글을 삭제하시겠습니까?");
    setConfirmAction(() => handleDelete);
    setIsModal(true);
  }

  async function handleDelete() {
    try {
      await deletePost(params.commudetail);
      router.push("/commu");
    } catch (error) {
      console.error("Failed to delete post", error);
    } finally {
      setIsModal(false);
    }
  }

  function closeModal() {
    setIsModal(false);
  }

  if (detail === null) {
    return <LoadingPage />;
  }

  if (!detail) {
    return (
      <div className={style.postcontainer}>
        <p>게시글을 불러오지 못했습니다.</p>
      </div>
    );
  }

  const writer = detail.writerName ?? detail.writer ?? "익명";
  const createdAt = formatDate(detail.createdAt ?? detail.date);
  const viewCount = detail.check ?? detail.viewCount ?? 0;

  return (
    <div className={style.postcontainer}>
      <section className={style.BoardSection}>
        <header className={style.BoardHeader}>
          <h2>{detail.title}</h2>
          <div className={style.HeaderInfo}>
            <div>작성자 {writer}</div>
            <div>|</div>
            <div>조회: {viewCount}</div>
            <div>|</div>
            <div>{createdAt}</div>
          </div>
        </header>
        <article className={style.BoardMain}>
          <div dangerouslySetInnerHTML={{ __html: detail.content ?? "" }} />
        </article>
      </section>

      <div className={style.btnarea}>
        {isAuthor && (
          <>
            <button onClick={confirmEdit}>수정</button>
            <button onClick={confirmDelete}>삭제</button>
          </>
        )}
      </div>

      {isModal && (
        <Modal onclose={closeModal}>
          <div className={style.requirelogin}>
            <button className={style.modalclosebtn} onClick={closeModal}>
              X
            </button>
            <div className={style.modaltext}>{confirmText}</div>
            <div className={style.deletebtnbox}>
              {confirmAction && (
                <button className={style.deleteselectbtn} onClick={() => confirmAction?.()}>
                  확인
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
