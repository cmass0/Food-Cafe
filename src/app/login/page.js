"use client";

import Link from "next/link";
import AuthButtons from "@/features/user/ui/AuthButtons";
import style from "./page.module.css";

export default function LoginPage() {
  return (
    <div className={style.loginpagebox}>
      <div className={style.logincontainer}>
        <header className={style.loginlogo}>
          <Link href="/" className={style.logoLink}>
            Food Cafe
          </Link>
        </header>
        <main className={style.loginbox}>
          <h1 className={style.loginTitle}>Sign in with a social account</h1>
          <p className={style.loginDescription}>
            Choose Google, GitHub, Kakao, or Apple to continue with your account.
          </p>
          <AuthButtons />
        </main>
        <footer className={style.loginfooter}>
          <Link href="/signup" className={style.signupLink}>
            New here? Create an account
          </Link>
        </footer>
      </div>
    </div>
  );
}
