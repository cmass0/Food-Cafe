"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";

import LoadingPage from "@/app/loading";
import { fetchUsernameByUid } from "@/features/user/client";
import uploadImage from "@/lib/uploadImage";
import { createPost } from "@/features/post/api";
import { auth } from "@/lib/firebase/client";

import style from "./page.module.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function PostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("user");
  const [initializing, setInitializing] = useState(true);
  const [user] = useAuthState(auth);
  const router = useRouter();
  const quillRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveDisplayName() {
      if (!user) {
        if (!cancelled) setInitializing(false);
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
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    resolveDisplayName();

    return () => {
      cancelled = true;
    };
  }, [user]);

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

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await createPost({
        title,
        content,
        writerName: userName,
        writerUid: user?.uid ?? undefined,
      });

      setTitle("");
      setContent("");
      router.push("/commu");
    } catch (error) {
      console.error("Failed to create post", error);
    }
  }

  if (initializing) {
    return <LoadingPage />;
  }

  return (
    <div className={style.container}>
      <h2 className={style.heading}>Create Post</h2>
      <form onSubmit={handleSubmit} className={style.form}>
        <div className={style.formGroup}>
          <label htmlFor="title" className={style.label}>
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={style.input}
            placeholder="Enter the title"
            required
          />
        </div>
        <div className={style.formGroup}>
          <label htmlFor="content" className={style.label}>
            Content
          </label>
          <ReactQuill
            ref={quillRef}
            value={content}
            onChange={setContent}
            modules={modules}
            className={style.editor}
            placeholder="Write your post here"
          />
        </div>
        <div className={style.preview}></div>
        <div className={style.btnarea}>
          <button type="submit" className={style.button}>
            Publish
          </button>
          <button type="button" className={style.canclebtn} onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
