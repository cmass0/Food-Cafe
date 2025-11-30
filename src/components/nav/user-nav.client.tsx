"use client";

import type { Session } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoginPage from "@/app/auth/signin-signup/page";

import { useAuth } from "@/app/auth/auth-context";

type Props = { session: Session | null };

export default function ClientUserNav({ session }: Props) {
  const user = session?.user ?? null;
  const name = useAuth().displayName;

  if (!user) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="rounded-xl bg-green-800">
            <div className="flex items-center gap-1 text-white">
              <div className="text-sm">로그인</div>
              <div>/</div>
              <div className="text-sm">회원가입</div>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px] p-0">
          <LoginPage />
        </DialogContent>
      </Dialog>
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
