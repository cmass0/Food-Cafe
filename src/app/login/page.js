"use client";

import Link from "next/link";
import style from "./page.module.css";
import { auth } from "@/lib/firebase/client";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/app/context/Auth-context";
// import { Auth, browserSessionPersistence, setPersistence } from "firebase/auth";

export default function LoginPage() {
  const [InputEmail, setInputEmail] = useState("");
  const [InputPassword, setInputPassword] = useState("");
  const [KeepSignIn, setKeepSignIn] = useState(false);
  const [signinWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
  const [errormsg, setErrorMsg] = useState("");
  const router = useRouter();
  const { userAuthData, googleLogin, logout } = AuthUser();

  async function SigninHD(e) {
    e.preventDefault();
    const res = await signinWithEmailAndPassword(InputEmail, InputPassword);

    if (!InputEmail) {
      setErrorMsg("이메일을 입력해 주세요");
      return;
    }
    if (!InputPassword) {
      setErrorMsg("비밀번호를 입력해 주세요");
      return;
    }
    if (InputEmail && InputPassword) {
      if (!res) {
        setErrorMsg("이메일이나 비밀번호를 다시 입력해 주세요");
        return;
      }
    }
    try {
      const persistenceType = KeepSignIn ? browserLocalPersistence : undefined;
      if (persistenceType) {
        console.log("local");
        await setPersistence(Auth, persistenceType);
      }

      sessionStorage.setItem("user", true);
      setInputEmail("");
      setInputPassword("");
      router.push("/");
      console.log(res);
    } catch (err) {
      console.error("err msg: ", err.message);
    }
  }

  async function GoogleSignInHD() {
    try {
      await googleLogin();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className={style.loginpagebox}>
      <div className={style.logincontainer}>
        <div className={style.loginlogo}>
          <header>
            <Link href="/">Food Cafe</Link>
          </header>
        </div>
        <div className={style.loginbox}>
          <main>
            <form onSubmit={SigninHD} className={style.loginform}>
              <input
                placeholder="이메일"
                type="text"
                name="email"
                value={InputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
              ></input>
              <input
                placeholder="비밀번호"
                type="password"
                name="password"
                value={InputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
              ></input>
              <div className={style.LoginKeepArea}>
                <div className={style.LoginKeepContents}>
                  <input
                    id="keep"
                    type="checkbox"
                    name="keep"
                    checked={KeepSignIn}
                    onChange={(e) => setKeepSignIn(e.target.checked)}
                  ></input>
                  <label htmlFor="keep">로그인 유지하기</label>
                </div>
              </div>
              <button type="submit" className={style.loginbtn}>
                로그인
              </button>
            </form>
          </main>
          <footer className={style.loginfooter}>
            <div className={style.FooterIdPass}>
              {/* <div>아이디 찾기</div>
              <div>/</div>
              <div>비밀번호 찾기</div> */}
            </div>
            <div className={style.FooterSignup}>
              <Link href="/signup">
                <button>회원가입</button>
              </Link>
            </div>
          </footer>
          <div className={style.errorcontainer}>
            {errormsg && <p className={style.errormsg}>Error: {errormsg}</p>}
          </div>
        </div>
      </div>
      <div className={style.loginproviderbox}>
        <button className={style.googleloginbtn} onClick={GoogleSignInHD}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google logo"
            className={style.googlelogo}
          />
          Google 계정으로 로그인
        </button>
      </div>
    </div>
  );
}
