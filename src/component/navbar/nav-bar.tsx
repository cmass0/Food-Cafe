"use client";

import { ChefHat, CircleUserRound, LogIn, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { deriveDisplayName } from "@/domain/user/lib/displayName";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/recipes", label: "레시피" },
  { href: "/combos", label: "레시피 조합" },
  { href: "/posts", label: "커뮤니티" },
  { href: "/ranking", label: "랭킹" },
];

function NavbarInner() {
  const [searchText, setSearchText] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status, displayName } = useAuth();
  const { openAuthModal } = useAuthModal();
  const name = displayName || deriveDisplayName(user) || "내 프로필";

  function isActivePath(href: string) {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchText.trim();
    if (!query) return;
    router.push(`/search?query=${encodeURIComponent(query)}`);
    setIsSheetOpen(false);
  }

  function handleOpenAuth() {
    const params = searchParams.toString();
    const next = pathname ? (params ? `${pathname}?${params}` : pathname) : "/";
    openAuthModal({ next });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-5 px-5 lg:px-8">
        <div className="flex items-center gap-9">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-950"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#438e4d] text-white">
              <ChefHat className="h-5 w-5" />
            </span>
            FoodCafe
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "transition hover:text-[#438e4d]",
                    active ? "text-[#438e4d]" : "text-zinc-700"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden flex-1 items-center justify-end gap-5 lg:flex">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[320px]">
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="레시피, 재료, 닉네임 검색..."
              className="h-10 rounded-full border-0 bg-zinc-100 pl-5 pr-11 text-sm shadow-none placeholder:text-zinc-400 focus-visible:ring-[#438e4d]"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-900"
              aria-label="검색"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {status === "loading" ? (
            <div className="h-10 w-36 animate-pulse rounded-lg bg-zinc-100" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-lg border-zinc-200 bg-white px-4">
                  <CircleUserRound className="mr-2 h-4 w-4" />
                  {name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">마이페이지</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form action="/auth/signout" method="post">
                    <button type="submit">로그아웃</button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleOpenAuth}
              className="h-10 rounded-lg bg-[#438e4d] px-6 text-sm font-bold text-white hover:bg-[#34783f]"
            >
              로그인
            </Button>
          )}
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="메뉴 열기">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-white">
            <SheetHeader className="text-left">
              <SheetTitle>FoodCafe</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="레시피 검색"
                  className="h-10 rounded-lg pl-4 pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="검색"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
              <nav className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-bold",
                        isActivePath(item.href) ? "bg-emerald-50 text-[#438e4d]" : "text-zinc-700"
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              {user ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-[#438e4d]">
                  {name}
                </div>
              ) : (
                <Button
                  onClick={handleOpenAuth}
                  className="w-full rounded-lg bg-[#438e4d] text-white"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-[68px] border-b border-zinc-200 bg-white" />}>
      <NavbarInner />
    </Suspense>
  );
}
