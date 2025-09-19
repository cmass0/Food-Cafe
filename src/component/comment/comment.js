"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

import { createComment, deleteComment, listComments } from "@/features/comment/api";
import { auth } from "@/lib/firebase/client";
import { fetchUsernameByUid } from "@/data/fetchuser-client";
import Modal from "../modal/modal";
import style from "./comment.module.css";

const COMMENTS_LIMIT = 100;

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const datePart = date.toLocaleDateString("ko-KR");
  const timePart = date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} ${timePart}`;
}

export default function CommentArea({ type }) {
  const [user] = useAuthState(auth);
  const [displayName, setDisplayName] = useState("user");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const loadComments = useCallback(async () => {
    if (!type) return;
    try {
      setLoading(true);
      const payload = await listComments({ limit: COMMENTS_LIMIT, type });
      const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
      setComments(items.slice().reverse());
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    let cancelled = false;

    async function resolveDisplayName() {
      if (!user) {
        if (!cancelled) setDisplayName("user");
        return;
      }

      const usesPasswordProvider = user.providerData?.some((p) => p?.providerId === "password");
      if (!usesPasswordProvider) {
        if (!cancelled) setDisplayName(user.displayName ?? "user");
        return;
      }

      try {
        const resolved = await fetchUsernameByUid(user.uid);
        if (!cancelled) setDisplayName(resolved ?? user.displayName ?? "user");
      } catch (error) {
        console.error("Failed to resolve username", error);
        if (!cancelled) setDisplayName(user.displayName ?? "user");
      }
    }

    resolveDisplayName();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalMessage("");
    setPendingDeleteId(null);
  }, []);

  const openAlert = useCallback((message) => {
    setModalMessage(message);
    setPendingDeleteId(null);
    setModalOpen(true);
  }, []);

  const openDeleteConfirm = useCallback((id) => {
    setModalMessage("댓글을 삭제하시겠습니까?");
    setPendingDeleteId(id);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user) {
      openAlert("로그인이 필요한 서비스입니다.");
      return;
    }
    if (!comment.trim()) {
      openAlert("댓글 내용을 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await createComment({
        comment: comment.trim(),
        writerName: displayName,
        writerUid: user?.uid ?? undefined,
        type,
      });
      setComment("");
      await loadComments();
    } catch (error) {
      console.error("Failed to create comment", error);
      openAlert("댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [comment, displayName, loadComments, openAlert, type, user]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteComment(pendingDeleteId);
      await loadComments();
    } catch (error) {
      console.error("Failed to delete comment", error);
      openAlert("댓글 삭제 중 오류가 발생했습니다.");
      return;
    }
    closeModal();
  }, [closeModal, loadComments, openAlert, pendingDeleteId]);

  const canDelete = useCallback(
    (item) => {
      if (!user) return false;
      if (item.writerUid) return item.writerUid === user.uid;
      return item.writerName === displayName;
    },
    [displayName, user]
  );

  const renderedComments = useMemo(() => {
    if (loading) {
      return (
        <li>
          <div className={style.contentcontainer}>댓글을 불러오는 중입니다...</div>
        </li>
      );
    }

    if (comments.length === 0) {
      return (
        <li>
          <div className={style.contentcontainer}>첫 번째 댓글을 남겨보세요.</div>
        </li>
      );
    }

    return comments.map((item) => (
      <li key={item.id}>
        <div className={style.contentcontainer}>
          <div className={style.creator}>
            <span className={style.creatorbar}>|</span>
            {item.writerName}
            <div className={style.commentdate}>{formatDateTime(item.createdAt ?? item.updatedAt)}</div>
          </div>
          <div className={style.comment}>
            {item.comment}
            {canDelete(item) && (
              <button
                className={style.deletebtn}
                onClick={() => openDeleteConfirm(item.id)}
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </li>
    ));
  }, [canDelete, comments, loading, openDeleteConfirm]);

  return (
    <div className={style.commentarea}>
      <div className={style.commentheader}>
        <h2>댓글</h2>
      </div>

      <ul className={style.comment}>
        <div>
          <textarea
            placeholder="댓글을 입력해 주세요..."
            rows={4}
            cols={50}
            className={style.textarea}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <br />
          <button
            onClick={handleSubmit}
            className={style.submitbtn}
            disabled={submitting}
          >
            {submitting ? "작성 중..." : "댓글 작성"}
          </button>
        </div>
        {renderedComments}
      </ul>

      {modalOpen && (
        <Modal onclose={closeModal}>
          <div className={style.requirelogin}>
            <button className={style.modalclosebtn} onClick={closeModal}>
              X
            </button>
            <div className={style.modaltext}>{modalMessage}</div>
            <div className={style.deletebtnbox}>
              {pendingDeleteId && (
                <button className={style.deleteselectbtn} onClick={handleDeleteConfirm}>
                  삭제
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
