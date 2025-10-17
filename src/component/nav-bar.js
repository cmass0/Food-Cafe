"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Input } from "@heroui/react";
import { SearchIcon } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";

import style from "./nav-bar.module.css";
import NavLink from "./navlink/navlink";
import ThemeToggle from "@/component/theme-toggle";
import { searchInputClassNames } from "@/styles/input/searchUI";
import { auth } from "@/lib/firebase/client";
import { fetchUsernameByUid } from "@/features/user/client";

export default function Navbar({ rightSlot }) {
  const [searchText, setSearchText] = useState("");
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

  function handleSearchSubmit(event) {
    event.preventDefault();
    router.push(`/search?query=${encodeURIComponent(searchText)}`);
  }

  return (
    <div className={style.navcontainer}>
      <div className={style.header}>
        <div>
          <Link href="/" className={style.logo}>
            Food Cafe
          </Link>
        </div>
        <form onSubmit={handleSearchSubmit} className={style.searchcontainer}>
          <div>
            <Input
              value={searchText}
              onValueChange={setSearchText}
              onClear={() => {
                setSearchText("");
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
          <NavLink href="/meals">레시피</NavLink>
          <NavLink href="/posts">커뮤니티</NavLink>
          {rightSlot}
        </div>
      </div>
    </div>
  );
}
