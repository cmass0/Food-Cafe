"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import style from "./page.module.css";

import uploadImage from "@/data/imagehandle";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import LoadingPage from "@/app/loading";
import { fetchUsernameByUid } from "@/data/fetchuser-client";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

async function fetchPosts() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/post`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load posts: ${response.status}`);
  }

  return response.json();
}

export default function PostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [maxNumber, setMaxNumber] = useState(0);
  const router = useRouter();
  const [user] = useAuthState(auth);
  const quillRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const providerId = user.providerData[0]?.providerId;

    async function resolveDisplayName() {
      if (providerId === "password") {
        const username = await fetchUsernameByUid(user.uid);
        if (username) {
          setUserName(username);
          return;
        }
      }

      setUserName(user.displayName || "user");
    }

    resolveDisplayName().catch((err) => {
      console.error("Failed to resolve display name", err);
    });
  }, [user]);

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await fetchPosts();
        const sorted = [...(data?.data ?? [])].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
        const last = sorted[sorted.length - 1];
        setMaxNumber(last?.number ?? 0);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const imageUrl = await uploadImage(file);
      const editor = quillRef.current?.getEditor?.();
      if (!editor) return;

      const range = editor.getSelection(true);
      editor.insertEmbed(range.index, "image", imageUrl, "user");
      editor.setSelection(range.index + 1, 0, "user");
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          title,
          content,
          writer: userName,
          number: maxNumber + 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.status}`);
      }

      await response.json();
      setTitle("");
      setContent("");
      router.push("/commu");
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
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
