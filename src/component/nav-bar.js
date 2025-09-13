"use client";

import Link from "next/link";
import style from "./nav-bar.module.css";
import NavLink from "./navlink/navlink";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import ThemeToggle from "@/component/theme-toggle";
import { Input } from "@heroui/react";
import { SearchIcon } from "lucide-react";
import { searchInputClassNames } from "@/styles/input/searchUI";

export default function Navbar(props) {
  const [isModal, setIsmodal] = useState(false); // loginform 이동
  const [searchtext, setsearchText] = useState("");
  const [userName, setUserName] = useState("");
  const [user] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const loginIdentifier = user.providerData[0]?.providerId;
      async function ReadUserData() {
        if (loginIdentifier === "password") {
          const Usersnap = await getDoc(doc(db, "User", user.uid));
          const Userdata = Usersnap.exists() ? Usersnap.data() : null;

          setUserName(Userdata?.username ?? "user");
        } else {
          setUserName(user.displayName || "user");
        }
      }
      ReadUserData();
    }
  }, [user]);

  function SearchHD(e) {
    e.preventDefault();
    router.push(`/search?query=${encodeURIComponent(searchtext)}`);
  }

  function modalHD(e) {
    setIsmodal(true);
  }

  function ModalclickHD(e) {
    setIsmodal(false);
  } // loginform 이동

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
          <div className="">
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
          {/* <NavLink href="/ranking">랭킹</NavLink> */}
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
