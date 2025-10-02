"use client";

import { useMemo } from "react";
import type { Session, User } from "@supabase/supabase-js";
// shadcn/ui
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type Props = { session: Session | null };

function displayName(user: User | null) {
  if (!user) return null;
  // 1) 공통 메타
  const um = (user.user_metadata ?? {}) as Record<string, any>;
  const nameCommon = um.full_name || um.name || um.nickname || um.user_name;
  if (nameCommon) return nameCommon as string;

  const id = (user.identities ?? [])[0];
  const p = id?.provider;
  const d = (id?.identity_data ?? {}) as Record<string, any>;
  if (p === "github") return d.user_name || d.name || user.email;
  if (p === "google") return d.name || user.email;
  if (p === "kakao")
    return d.properties?.nickname || d.kakao_account?.profile?.nickname || user.email;

  return user.email;
}

export default function ClientUserNav({ session }: Props) {
  const user = session?.user ?? null;
  const name = useMemo(() => displayName(user), [user]);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a href="/auth/signin" className="text-sm">
          로그인
        </a>
        <a href="/auth/signup" className="text-sm">
          회원가입
        </a>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9">
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
