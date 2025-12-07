"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";

import ThemeToggle from "@/component/theme-toggle";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

import { useAuth } from "@/app/auth/auth-context";

export default function Navbar({ rightSlot }: { rightSlot: React.ReactNode }) {
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  const { displayName, status } = useAuth();

  status === "authenticated" && displayName ? displayName : "";

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/search?query=${encodeURIComponent(searchText)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-700 bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 text-white shadow-lg">
      {/* Top bar: 브랜드 / 메뉴 / 액션 */}
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: 로고 + 메인 메뉴 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Food Cafe
          </Link>
          <NavigationMenu>
            <NavigationMenuList className="hidden gap-2 text-sm font-medium text-emerald-50 md:flex">
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="rounded-full px-3 py-2 transition hover:bg-white/10"
                >
                  <Link href="/recipes">레시피</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="rounded-full px-3 py-2 transition hover:bg-white/10"
                >
                  <Link href="/posts">커뮤니티</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right: 토글 + 유저 + 슬롯 */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {rightSlot}
        </div>
      </div>

      {/* Bottom bar: 검색 영역 */}
      <div className="border-t border-emerald-500/40 bg-emerald-700/95">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          {/* 앞으로 카테고리/필터 드롭다운을 둘 자리 */}
          {/* <CategorySelect /> */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-100/80" />
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="레시피와 커뮤니티를 검색해 보세요"
              className="h-10 rounded-full border-emerald-500/70 bg-emerald-50/95 pl-9 text-sm text-emerald-950 placeholder:text-emerald-900/60"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
