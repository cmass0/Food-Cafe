"use client";

import style from "./page.module.css";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createUser } from "@/features/user/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkDuplicate } from "@/Authlogic/nicknamecheck";
import classNames from "classnames";

export default function SignupPage() {
  const [UserName, setUserName] = useState("");
  const [UserEmail, setUserEmail] = useState("");
  const [UserPassword, setUserPassword] = useState("");
  const [Errormsg, setErrormsg] = useState("");
  const [nicknameerr, setNickNameErr] = useState("");
  const [emailvalid, setEmailValid] = useState("");
  const [passvalid, setPassValid] = useState("");
  const [usernamevalid, SetUserNameValid] = useState(false);
  const [useremailvalid, SetUserEmailValid] = useState(false);
  const [userpassvalid, SetUserPassValid] = useState(false);

  const router = useRouter();

  const [createUserWithEmailAndPassword, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);

  async function SignupHD(data) {
    data.preventDefault();

    try {
      const credential = await createUserWithEmailAndPassword(
        UserEmail,
        UserPassword
      );

      if (!credential || !credential.user) {
        throw new Error("AUTH_CREATION_FAILED");
      }

      await createUser({
        id: credential.user.uid,
        email: UserEmail,
        username: UserName,
      });

      await signOut(auth);

      setUserName("");
      setUserEmail("");
      setUserPassword("");

      alert("?Œì›ê°€?…ì— ?±ê³µ?ˆìŠµ?ˆë‹¤ ë¡œê·¸?¸ì„ ì§„í–‰??ì£¼ì„¸??);
      router.push("/auth/signin-signup");
    } catch (error) {
      console.error(error);
      const errorCode = error?.code ?? null;

      if (errorCode) {
        switch (errorCode) {
          case "auth/invalid-email":
            setErrormsg("?˜ëª»???´ë©”??ì£¼ì†Œ?…ë‹ˆ??);
            break;
          case "auth/email-already-in-use":
            setErrormsg("?´ë? ì¡´ì¬?˜ëŠ” ?´ë©”?¼ì…?ˆë‹¤.");
            break;
          case "auth/weak-password":
            setErrormsg("ë¹„ë?ë²ˆí˜¸??6?ë¦¬ ?´ìƒ?´ì–´???©ë‹ˆ??);
            break;
          default:
            setErrormsg("?Œì›ê°€???„ì¤‘ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„??ì£¼ì„¸??);
            break;
        }
      } else if (error instanceof Error && error.message === "AUTH_CREATION_FAILED") {
        setErrormsg("?Œì› ê³„ì • ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„??ì£¼ì„¸??");
      } else {
        setErrormsg("?Œì›ê°€???„ì¤‘ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„??ì£¼ì„¸??);
      }
    }
  }

  async function duplicateHD() {
    const duplicate = await checkDuplicate(UserName);
    if (duplicate) {
      setNickNameErr("?´ë? ?¬ìš©ì¤‘ì¸ ?‰ë„¤?„ì…?ˆë‹¤.");
      SetUserNameValid(false);
    } else {
      if (UserName !== "") {
        setNickNameErr("?¬ìš© ê°€?¥í•œ ?‰ë„¤?„ì…?ˆë‹¤.");
        SetUserNameValid(true);
      }
    }

    if (UserName === "") {
      setNickNameErr("?‰ë„¤?„ì„ ?…ë ¥??ì£¼ì„¸??");
      SetUserNameValid(false);
    }
  }

  function emailcheck(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  useEffect(() => {
    if (UserEmail) {
      if (emailcheck(UserEmail)) {
        setEmailValid("? íš¨???´ë©”???•ì‹?…ë‹ˆ??");
        SetUserEmailValid(true);
      } else {
        setEmailValid("? íš¨?˜ì? ?Šì? ?´ë©”???•ì‹?…ë‹ˆ??");
        SetUserEmailValid(false);
      }
    } else {
      setEmailValid("? íš¨?˜ì? ?Šì? ?´ë©”???•ì‹?…ë‹ˆ??");
      SetUserEmailValid(false);
    }
  }, [UserEmail]);

  async function emailHD(e) {
    setUserEmail(e.target.value);
  }

  useEffect(() => {
    if (UserPassword.length >= 6) {
      setPassValid("");
      SetUserPassValid(true);
    } else {
      setPassValid("ë¹„ë?ë²ˆí˜¸??6?ë¦¬ ?´ìƒ ?…ë ¥?´ì£¼?¸ìš”");
      SetUserPassValid(false);
    }
  }, [UserPassword]);

  return (
    <div className={style.pagecontainer}>
      <div className={style.container}>
        <h1>Sign Up</h1>
        <form className={style.form} onSubmit={SignupHD}>
          <div className={style.formGroup}>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={UserName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="?‰ë„¤??
              maxLength={8}
            />
          </div>
          <button
            type="button"
            className={style.duplicatebtn}
            onClick={duplicateHD}
          >
            ì¤‘ë³µ?•ì¸
          </button>
          <span className={style.nicknamemsg}>{nicknameerr}</span>
          <div className={style.formGroup}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={UserEmail}
              onChange={emailHD}
              placeholder="?´ë©”??
            />
          </div>
          <div className={style.emailmsg}>{emailvalid}</div>
          <div className={style.formGroup}>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={UserPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="ë¹„ë?ë²ˆí˜¸"
            />
          </div>
          <div className={style.passwordlogic}>{passvalid}</div>
          <div className={style.signupbtncontainer}>
            <button
              disabled={!usernamevalid || !useremailvalid || !userpassvalid}
              type="submit"
              className={classNames(style.button, {
                [style.disabled]:
                  !usernamevalid || !useremailvalid || !userpassvalid,
              })}
            >
              ?Œì›ê°€??            </button>
            {/* {loading && <p>Loading...</p>} */}
            {Errormsg && <p className={style.errormsg}>Error: {Errormsg}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}