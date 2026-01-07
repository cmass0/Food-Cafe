"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { deriveDisplayName } from "@/domain/user/lib/displayName";
import Link from "next/link";

export default function ProfileButton() {
  const { user, status, displayName } = useAuth();
  const name = displayName || deriveDisplayName(user) || "";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openAuthModal } = useAuthModal();

  const handleOpenAuth = () => {
    const params = searchParams.toString();
    const next = pathname ? (params ? `${pathname}?${params}` : pathname) : "/";
    openAuthModal({ next });
  };

  // 로딩중 빈공간 스켈레톤
  if (status === "loading") {
    return (
      <div className="h-9 w-24 rounded-full bg-emerald-50/70 animate-pulse" aria-hidden="true" />
    );
  }

  if (!user) {
    return (
      <Button className="rounded-xl bg-green-800" onClick={handleOpenAuth}>
        <div className="flex items-center gap-1 text-white">
          <div className="text-sm">로그인</div>
          <div>/</div>
          <div className="text-sm">회원가입</div>
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className="h-9 rounded-full bg-emerald-50 px-4 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
        >
          {name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile">내 프로필</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">설정</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <form action="/auth/signout" method="post">
            <button type="submit">로그아웃</button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
