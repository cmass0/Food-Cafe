"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import style from "./page.module.css";

import uploadImage from "@/data/imagehandle";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import LoadingPage from "@/app/loading";
import { fetchUsernameByUid } from "@/data/fetchuser-client";

async function fetchpost() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/post`, {
    cache: "no-store",
  });
  return response.json();
}

export default function PostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setloading] = useState(true);
  const [maxnum, setMaxNum] = useState(0);
  const router = useRouter();
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      console.log(user.uid);
      const loginIdentifier = user.providerData[0]?.providerId;
      async function ReadUserData() {
        if (loginIdentifier === "password") {
          const username = await fetchUsernameByUid(user.uid);

          if (username) {
            setUserName(username);
          }
        } else {
          setUserName(user.displayName || "user");
        }
      }
      ReadUserData();
    }
  }, [user]);

  useEffect(() => {
    async function fetchpostdata() {
      try {
        const data = await fetchpost();
        const sortData = data.data.sort((a, b) => a.number - b.number);
        const maxnum = sortData[sortData.length - 1].number;
        setMaxNum(maxnum);
        console.log(maxnum);
        setloading(false);
      } catch (err) {
        console.error("err: ", err);
        setloading(false);
      }
    }

    fetchpostdata();
  }, []);

  async function handleSubmit(data) {
    data.preventDefault();
    const newPost = new FormData(data.target);
    console.log(newPost);

    setTitle("");
    setContent("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/post`, {
        method: "post",
        body: JSON.stringify({
          title,
          content,
          writer: userName,
          number: maxnum + 1,
        }),

        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const post = await response.json();
      console.log(`post 추가 완료: ${post}`);
      router.push("/commu");
    } catch (err) {
      console.error("err: ", err);
    }
  }

  function CanCleBtnHD(e) {
    router.back();
  }

  function PostSubmitBtnHD(e) {
    // router.refresh();
  }

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const imageurl = await uploadImage(file);
      const editor = quillRef.current?.getEditor?.();
      if (!editor) return;
      const range = editor.getSelection(true);
      editor.insertEmbed(range.index, "image", imageurl, "user");
      editor.setSelection(range.index + 1, 0, "user");
    };
    input.click();
  }, []);

  const modules = useMemo(() => {
    return {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    };
  }, [imageHandler]);

  if (loading) {
    return <LoadingPage></LoadingPage>;
  }

  return (
    <div className={style.container}>
      <h2 className={style.heading}>게시글 작성하기</h2>
      <form onSubmit={handleSubmit} className={style.form}>
        <div className={style.formGroup}>
          <label htmlFor="title" className={style.label}>
            제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={style.input}
            placeholder="제목을 입력하세요"
            required
          />
        </div>
        <div className={style.formGroup}>
          <label htmlFor="content" className={style.label}>
            내용
          </label>
          <ReactQuill
            value={content}
            onChange={setContent}
            modules={modules}
            className={style.editor}
            placeholder="내용을 입력하세요"
          />
        </div>
        <div className={style.preview}></div>
        <div className={style.btnarea}>
          <button type="submit" className={style.button} onClick={PostSubmitBtnHD}>
            게시글 작성
          </button>
          <button className={style.canclebtn} onClick={CanCleBtnHD}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
