"use client";

import { Menu, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { useAuth } from "@/app/auth/auth-context";
import ProfileButton from "@/components/nav/user-nav.client";

const NAV_ITEMS = [
  { href: "/recipes", label: "레시피" },
  { href: "/combos", label: "레시피 조합" },
  { href: "/posts", label: "커뮤니티" },
  { href: "/ranking", label: "랭킹" },
];

export default function Navbar() {
  const [searchText, setSearchText] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { displayName, status } = useAuth();

  status === "authenticated" && displayName ? displayName : "";

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/search?query=${encodeURIComponent(searchText)}`);
  }

  function handleSheetSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    handleSearchSubmit(event);
    setIsSheetOpen(false);
  }

  const isActivePath = (href: string) => {
    if (!pathname) return false;
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-700 bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 text-white shadow-lg ">
      {/* Top bar: 브랜드 / 메뉴 / 액션 */}
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: 로고 + 메인 메뉴 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Food Cafe
          </Link>
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-2 text-sm font-medium text-emerald-50">
              {NAV_ITEMS.map((item) => {
                const isActive = isActivePath(item.href);
                return (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink
                      asChild
                      className={cn(
                        "rounded-full px-3 py-2 transition",
                        isActive ? "bg-white/20 text-white" : "hover:bg-white/10"
                      )}
                    >
                      <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* 다크모드 & 유저 슬롯*/}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex">
            <ProfileButton />
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-white/10 hover:text-white"
                aria-label="메뉴 열기"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] max-w-[85vw] bg-emerald-50 text-emerald-950 sm:w-[320px]"
            >
              <SheetHeader className="text-left">
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-6">
                <nav className="flex flex-col gap-2">
                  {NAV_ITEMS.map((item) => {
                    const isActive = isActivePath(item.href);
                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "rounded-md px-3 py-2 text-sm font-medium transition",
                            isActive
                              ? "bg-emerald-200 text-emerald-950"
                              : "text-emerald-900/80 hover:bg-emerald-100"
                          )}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>

                <div className="rounded-lg border border-emerald-200 bg-white/90 p-3">
                  <form onSubmit={handleSheetSearchSubmit} className="relative">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500/80" />
                    <Input
                      id="mobile-site-search"
                      name="mobile-site-search"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="검색어를 입력하세요"
                      className="h-10 rounded-full border-emerald-200 bg-white pl-9 text-sm text-emerald-950 placeholder:text-emerald-400"
                    />
                  </form>
                </div>

                <div className="border-t border-emerald-100 pt-4">
                  <ProfileButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* navbar 하단 검색 */}
      <div className="hidden border-t border-emerald-500/40 bg-emerald-700/95 lg:block">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          {/* 앞으로 카테고리/필터 드롭다운을 둘 자리 */}
          {/* <CategorySelect /> */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-100/80" />
            <Input
              id="site-search"
              name="site-search"
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
