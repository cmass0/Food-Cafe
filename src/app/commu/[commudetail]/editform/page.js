"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import style from "./page.module.css";

import uploadImage from "@/data/imagehandle";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import { fetchUser } from "@/data/user";
import Modal from "@/component/modal/modal";

export default function PostForm({ params }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("");
  const [isModal, setIsModal] = useState(false);
  const router = useRouter();
  const [user] = useAuthState(auth);
  console.log(content);
  console.log(title);

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

  useEffect(
    () => {
      async function readpost() {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/post/${params.commudetail}`,
            {
              cache: "no-store",
            }
          );

          const responseonj = await response.json();
          const responsedata = responseonj.data;
          console.log(responsedata);
          setTitle(responsedata.title);
          setContent(responsedata.content);
        } catch (err) {
          console.error("읽기 실패: ", err);
        }
      }

      readpost();
    },
    { params }
  );

  async function handleSubmit(data) {
    data.preventDefault();

    setTitle("");
    setContent("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/post/${params.commudetail}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title,
            content,
            writer: userName,
          }),

          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

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

  function editqus(e) {
    setIsModal(true);
  }

  function onclose() {
    setIsModal(false);
  }

  function saveImage() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      console.log(file);
      if (file) {
        const imageurl = await uploadImage(file);
        const range = this.quill.getSelection();
        this.quill.insertEmbed(range.index, "image", imageurl);
      }
    };
  }

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
          image: saveImage,
        },
      },
    };
  }, []);

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
          <button type="button" className={style.button} onClick={editqus}>
            게시글 수정
          </button>
          <button className={style.canclebtn} onClick={CanCleBtnHD}>
            취소
          </button>
        </div>
      </form>
      {isModal && (
        <Modal onclose={onclose}>
          <div className={style.requirelogin}>
            <button className={style.modalclosebtn} onClick={onclose}>
              X
            </button>
            <div className={style.modaltext}>정말로 수정하시겠습니까?</div>
            <div className={style.deletebtnbox}>
              <button className={style.deleteselectbtn} onClick={handleSubmit}>
                수정하기
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
