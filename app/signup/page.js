"use client";

import style from "./page.module.css";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { Auth } from "@/data/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setDoc } from "firebase/firestore";
import { checkDuplicate } from "@/Authlogic/nicknamecheck";
import classNames from "classnames";

export default function signupPage() {
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
    useCreateUserWithEmailAndPassword(Auth);

  async function SignupHD(data) {
    data.preventDefault();
    const UserData = new FormData(data.target);
    // const UserName = UserData.get("username");
    // const UserEmail = UserData.get("email");

    try {
      // const userRes = await createUserWithEmailAndPassword(
      //   UserEmail,
      //   UserPassword
      // );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/user`,
        {
          method: "post",
          body: JSON.stringify({
            username: UserName,
            email: UserEmail,
            password: UserPassword,
            likerecipe: [],
          }),
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );
      console.log(data);
      if (!response.ok) {
        const errdata = await response.json();
        const error = new Error(errdata.message);
        error.code = errdata.code;
        throw error;
      }
      // console.log({ userRes });
      setUserName("");
      setUserEmail("");
      setUserPassword("");

      alert("회원가입에 성공했습니다 로그인을 진행해 주세요");
      router.push("/login");
    } catch (error) {
      console.log(error.code);
      if (error.code) {
        console.log("Error creating user:", error);
        switch (error.code) {
          case "auth/invalid-email":
            setErrormsg("잘못된 이메일 주소입니다");
            break;
          case "auth/email-already-in-use":
            setErrormsg("이미 존재하는 이메일입니다.");
            break;
          case "auth/weak-password":
            setErrormsg("비밀번호는 6자리 이상이어야 합니다");
            break;
          default:
            setErrormsg(
              "회원가입 도중 오류가 발생했습니다. 다시 시도해 주세요"
            );
            break;
        }
      } else {
        setErrormsg("회원가입 도중 오류가 발생했습니다. 다시 시도해 주세요");
      }
    }
  }

  async function duplicateHD() {
    const duplicate = await checkDuplicate(UserName);
    if (duplicate) {
      setNickNameErr("이미 사용중인 닉네임입니다.");
      SetUserNameValid(false);
    } else {
      if (UserName !== "") {
        setNickNameErr("사용 가능한 닉네임입니다.");
        SetUserNameValid(true);
      }
    }

    if (UserName === "") {
      setNickNameErr("닉네임을 입력해 주세요.");
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
        setEmailValid("유효한 이메일 형식입니다.");
        SetUserEmailValid(true);
      } else {
        setEmailValid("유효하지 않은 이메일 형식입니다.");
        SetUserEmailValid(false);
      }
    } else {
      setEmailValid("유효하지 않은 이메일 형식입니다.");
      setEmailValid(false);
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
      setPassValid("비밀번호는 6자리 이상 입력해주세요");
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
              placeholder="닉네임"
              maxLength="8"
            />
          </div>
          <button
            type="button"
            className={style.duplicatebtn}
            onClick={duplicateHD}
          >
            중복확인
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
              placeholder="이메일"
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
              placeholder="비밀번호"
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
              회원가입
            </button>
            {/* {loading && <p>Loading...</p>} */}
            {Errormsg && <p className={style.errormsg}>Error: {Errormsg}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
