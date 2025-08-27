"use client";

import { auth } from "@/lib/firebase/client";
import { fetchUser } from "@/data/user";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import Modal from "../modal/modal";
import style from "./comment.module.css";

async function fetchComment() {
  const getcomment = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/comment`,
    {
      cache: "no-cache",
    }
  );
  const commentdata = await getcomment.json();

  return commentdata;
}

export default function CommentArea({ type }) {
  const [isModal, setIsModal] = useState(false);
  const [ondeletebtn, setOnDeleteBtn] = useState(false);
  const [comment, setComment] = useState("");
  const [username, setUserName] = useState("");
  const [deleteid, setDeleteId] = useState("");
  const [commentdata, setCommentData] = useState([]);
  const [confirmtext, setConfirmText] = useState("");
  const [user] = useAuthState(auth);

  async function getcommet() {
    const commentlist = await fetchComment();
    // console.log(commentlist);
    // console.log(type);
    const filterdata = commentlist.data.filter(
      (comment) => comment.type === type
    );

    const sortdata = filterdata.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    // console.log(filterdata);
    setCommentData(sortdata);
  }

  useEffect(() => {
    getcommet();

    if (user) {
      const loginIdentifier = user.providerData[0]?.providerId;
      async function ReadUserData() {
        if (loginIdentifier === "password") {
          const profile = await fetchUser(user.uid);
          console.log(profile);

          if (profile) {
            setUserName(profile.username);
          }
        } else {
          setUserName(user.displayName);
        }
      }
      ReadUserData();
    }
  }, []);

  async function writecommentHD() {
    console.log(user);
    if (!user) {
      setIsModal(true);
      setConfirmText("로그인이 필요한 서비스입니다.");
      return;
    }
    if (comment === "" && user) {
      console.log(comment);
      setIsModal(true);
      setConfirmText("내용을 입력해 주세요.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/comment`,
        {
          method: "post",
          body: JSON.stringify({
            comment: comment,
            writer: username,
            type: type,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-cache",
        }
      );
      console.log(response);
      setComment("");
    } catch (err) {
      console.error("err: ", err);
    }

    getcommet();
  }

  async function deleteHD(id) {
    setIsModal(true);
    setOnDeleteBtn(true);
    setConfirmText("정말로 삭제하시겠습니까?");
    setDeleteId(id);
  }

  async function deleteOk() {
    setIsModal(false);
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/comment`, {
      method: "delete",
      body: JSON.stringify({
        id: deleteid,
      }),
      cache: "no-store",
    });
    getcommet();
  }

  function onclose() {
    setIsModal(false);
    setOnDeleteBtn(false);
  }

  return (
    <div className={style.commentarea}>
      <div className={style.commentheader}>
        <h2>댓글</h2>
      </div>

      <ul className={style.comment}>
        <div>
          <textarea
            placeholder="댓글을 입력하세요..."
            rows={4}
            cols={50}
            className={style.textarea}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
            }}
          ></textarea>
          <br />
          <button onClick={writecommentHD} className={style.submitbtn}>
            댓글 작성
          </button>
        </div>
        {commentdata.map((comment) => (
          <li key={comment.id}>
            <div className={style.contentcontainer}>
              <div className={style.creator}>
                <span className={style.creatorbar}>|</span>
                {comment.writer}
                <div className={style.commentdate}>
                  (<span>{comment.date.substring(0, 10)}</span>
                  <span>{comment.date.substring(11, 19)}</span>)
                </div>
              </div>

              <div className={style.comment}>
                {comment.comment}
                {comment.writer === username && (
                  <button
                    className={style.deletebtn}
                    onClick={() => deleteHD(comment.id)}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {isModal && (
        <Modal onclose={onclose}>
          <div className={style.requirelogin}>
            <button className={style.modalclosebtn} onClick={onclose}>
              X
            </button>
            <div className={style.modaltext}>{confirmtext}</div>
            <div className={style.deletebtnbox}>
              {ondeletebtn && (
                <button className={style.deleteselectbtn} onClick={deleteOk}>
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
