"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

import { Button as HeroButton, Card, CardBody, CardFooter, CardHeader } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

import { createComment, deleteComment, listComments } from "@/features/comment/api";
import { auth } from "@/lib/firebase/client";
import { fetchUsernameByUid } from "@/features/user/client";
import Modal from "../modal/modal";
import style from "./comment.module.css";

const COMMENTS_LIMIT = 100;

const MODAL_TEXT = {
  loginRequired: "로그인이 필요한 서비스입니다.",
  emptyComment: "댓글 내용을 입력해주세요.",
  createError: "댓글을 작성하는 중 오류가 발생했습니다.",
  deleteError: "댓글을 삭제하는 중 오류가 발생했습니다.",
  deleteConfirm: "댓글을 삭제하시겠습니까?",
};

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
    setModalMessage(MODAL_TEXT.deleteConfirm);
    setPendingDeleteId(id);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user) {
      openAlert(MODAL_TEXT.loginRequired);
      return;
    }
    if (!comment.trim()) {
      openAlert(MODAL_TEXT.emptyComment);
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
      openAlert(MODAL_TEXT.createError);
    } finally {
      setSubmitting(false);
    }
  }, [comment, displayName, loadComments, type, user, openAlert]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteComment(pendingDeleteId);
      closeModal();
      await loadComments();
    } catch (error) {
      console.error("Failed to delete comment", error);
      openAlert(MODAL_TEXT.deleteError);
    }
  }, [closeModal, loadComments, openAlert, pendingDeleteId]);

  const canDelete = useCallback(
    (item) => {
      if (!user) return false;
      return item.writerUid ? item.writerUid === user.uid : item.writerName === displayName;
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
          <div className={style.contentcontainer}>첫 번째 댓글을 남겨주세요.</div>
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
              <button className={style.deletebtn} onClick={() => openDeleteConfirm(item.id)}>
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
            placeholder="댓글을 입력해주세요..."
            rows={4}
            cols={50}
            className={style.textarea}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <br />
          <button onClick={handleSubmit} className={style.submitbtn} disabled={submitting}>
            {submitting ? "작성 중..." : "댓글 작성"}
          </button>
        </div>
        {renderedComments}
      </ul>

      {modalOpen && (
        <Modal onclose={closeModal}>
          <Card className={style.modalCard}>
            <CardHeader className={style.modalHeader}>
              <div className={style.modalHeaderContent}>
                <AlertTriangle className={style.modalIcon} size={20} />
                <span className={style.modalTitle}>{pendingDeleteId ? "댓글 삭제" : "알림"}</span>
              </div>
              <HeroButton
                isIconOnly
                variant="light"
                radius="full"
                size="sm"
                onPress={closeModal}
                className={style.modalCloseButton}
              >
                ×
              </HeroButton>
            </CardHeader>
            <CardBody className={style.modalBody}>
              {pendingDeleteId && (
                <div className={style.modalWarning}>
                  <AlertTriangle size={16} className={style.modalWarningIcon} />
                  <span>이 작업은 되돌릴 수 없습니다. 정말로 삭제하시겠습니까?</span>
                </div>
              )}
              <p className={style.modalText}>{modalMessage}</p>
            </CardBody>
            <CardFooter className={style.modalFooter}>
              <HeroButton
                variant="flat"
                radius="sm"
                onPress={closeModal}
                className={style.modalCancelButton}
              >
                {pendingDeleteId ? "취소" : "확인"}
              </HeroButton>
              {pendingDeleteId && (
                <HeroButton
                  variant="solid"
                  radius="sm"
                  onPress={handleDeleteConfirm}
                  className={style.modalDeleteButton}
                >
                  삭제
                </HeroButton>
              )}
            </CardFooter>
          </Card>
        </Modal>
      )}
    </div>
  );
}