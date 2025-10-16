"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";

import LoadingPage from "@/app/loading";
import Modal from "@/component/modal/modal";
import { fetchUsernameByUid } from "@/features/user/client";
import uploadImage from "@/lib/uploadImage";
import { getPost, updatePost } from "@/features/post/api";
import { auth } from "@/lib/firebase/client";

import style from "./page.module.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function PostEditPage({ params }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("user");
  const [showModal, setShowModal] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [user] = useAuthState(auth);
  const router = useRouter();
  const quillRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveDisplayName() {
      if (!user) {
        return;
      }

      try {
        const providerId = user.providerData?.[0]?.providerId;
        if (providerId === "password") {
          const username = await fetchUsernameByUid(user.uid);
          if (!cancelled) setUserName(username ?? user.displayName ?? "user");
        } else if (!cancelled) {
          setUserName(user.displayName ?? "user");
        }
      } catch (error) {
        console.error("Failed to resolve display name", error);
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
        if (cancelled || !data) return;
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
      } catch (error) {
        console.error('Failed to load post', error);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    }
    loadPost();

    return () => {
      cancelled = true;
    };
  }, [params.commudetail]);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const imageUrl = await uploadImage(file);
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return;

        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, "image", imageUrl, "user");
        editor.setSelection(range.index + 1, 0, "user");
      } catch (error) {
        console.error("Failed to upload image", error);
      }
    };

    input.click();
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: { image: imageHandler },
      },
    }),
    [imageHandler]
  );

  async function handleUpdate() {
    try {
      await updatePost(params.commudetail, {
        title,
        content,
        writerName: userName,
        writerUid: user?.uid ?? undefined,
      });
      router.push(`/commu/${params.commudetail}`);
    } catch (error) {
      console.error('Failed to update post', error);
    } finally {
      setShowModal(false);
    }
  }

  if (loadingPost) {
    return <LoadingPage />;
  }

  return (
    <div className={style.container}>
      <h2 className={style.heading}>게시글 수정</h2>
      <form className={style.form}>
        <div className={style.formGroup}>
          <label htmlFor="title" className={style.label}>
            제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={style.input}
            placeholder="제목을 입력해 주세요"
            required
          />
        </div>
        <div className={style.formGroup}>
          <label htmlFor="content" className={style.label}>
            내용
          </label>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            className={style.editor}
            placeholder="내용을 입력해 주세요"
          />
        </div>
        <div className={style.preview}></div>
        <div className={style.btnarea}>
          <button type="button" className={style.button} onClick={() => setShowModal(true)}>
            게시글 수정
          </button>
          <button type="button" className={style.canclebtn} onClick={() => router.back()}>
            취소
          </button>
        </div>
      </form>

      {showModal && (
        <Modal onclose={() => setShowModal(false)}>
          <div className={style.requirelogin}>
            <button className={style.modalclosebtn} onClick={() => setShowModal(false)}>
              X
            </button>
            <div className={style.modaltext}>정말 수정하시겠습니까?</div>
            <div className={style.deletebtnbox}>
              <button className={style.deleteselectbtn} onClick={handleUpdate}>
                수정하기
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}



