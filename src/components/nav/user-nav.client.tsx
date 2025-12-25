"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthModal } from "@/features/auth/ui/AuthModalProvider";
import { useAuth } from "@/app/auth/auth-context";

type Props = { session: Session | null };

function ClientUserNavInner({ session }: Props) {
  const user = session?.user ?? null;
  const name = useAuth().displayName;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openAuthModal } = useAuthModal();

  const handleOpenAuth = () => {
    const params = searchParams.toString();
    const next = pathname ? (params ? `${pathname}?${params}` : pathname) : "/";
    openAuthModal({ next });
  };

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
          <a href="/profile">내 프로필</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/settings">설정</a>
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

export default function ClientUserNav(props: Props) {
  return (
    <Suspense fallback={null}>
      <ClientUserNavInner {...props} />
    </Suspense>
  );
}
