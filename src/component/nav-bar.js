"use client";

import Link from "next/link";
import style from "./nav-bar.module.css";
import NavLink from "./navlink/navlink";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import ThemeToggle from "@/component/theme-toggle";
import { Input } from "@heroui/react";
import { SearchIcon } from "lucide-react";
import { searchInputClassNames } from "@/styles/input/searchUI";
import { fetchUsernameByUid } from "@/data/fetchuser-client";

export default function Navbar(props) {
  const [isModal, setIsmodal] = useState(false);
  const [searchtext, setsearchText] = useState("");
  const [userName, setUserName] = useState("");
  const [user] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function resolveUserName() {
      if (!user) {
        if (!cancelled) setUserName("");
        return;
      }

      const loginIdentifier = user.providerData[0]?.providerId;
      if (loginIdentifier === "password") {
        try {
          const resolved = await fetchUsernameByUid(user.uid);
          if (!cancelled) {
            setUserName(resolved ?? user.displayName ?? "user");
          }
          return;
        } catch (error) {
          console.error("Failed to resolve nav username", error);
        }
      }

      if (!cancelled) setUserName(user.displayName || "user");
    }

    resolveUserName();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function SearchHD(e) {
    e.preventDefault();
    router.push(`/search?query=${encodeURIComponent(searchtext)}`);
  }

  function modalHD() {
    setIsmodal(true);
  }

  function ModalclickHD() {
    setIsmodal(false);
  }

  function SearchTextHD(e) {
    setsearchText(e.target.value);
  }

  return (
    <div className={style.navcontainer}>
      <div className={style.header}>
        <div>
          <Link href="/" className={style.logo}>
            Food Cafe
          </Link>
        </div>
        <form onSubmit={SearchHD} className={style.searchcontainer}>
          <div>
            <Input
              value={searchtext}
              onValueChange={setsearchText}
              onClear={() => {
                setsearchText("");
                router.push("/search");
              }}
              isClearable
              classNames={searchInputClassNames}
              label="Search"
              placeholder="Type to search..."
              radius="lg"
              startContent={
                <SearchIcon size={16} className="text-foreground/60" strokeWidth={1.75} />
              }
            />
          </div>
        </form>
        <div className={style.nav}>
          <ThemeToggle />
          <NavLink href="/meals">음식 및 레시피 공유</NavLink>
          <NavLink href="/commu">커뮤니티</NavLink>
          {/* 버튼 컴포넌트 삽입  */}
          {!user && (
            <NavLink href="/login">
              <button onClick={modalHD} className={style.signbtn}>
                로그인 / 회원가입
              </button>
            </NavLink>
          )}
          {user && (
            <button
              onClick={() => {
                signOut(auth);
                sessionStorage.removeItem("user");
                window.location.reload();
              }}
              className={style.signoutbtn}
            >
              <span className={style.username}>{userName}</span>님 / 로그아웃
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
