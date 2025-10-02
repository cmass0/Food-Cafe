"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
// shadcn/ui
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoginPage from "@/app/login/page";

type Props = { session: Session | null };

function displayName(user: User | null) {
  if (!user) return null;
  console.log(user);
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = session?.user ?? null;
  const name = useMemo(() => displayName(user), [user]);

  if (!user) {
    {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-green-800 rounded-xl">
              <div className="flex items-center gap-1 text-white">
                <div className="text-sm">로그인</div>
                <div>/</div>
                <div className="text-sm">회원가입</div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] max-h-[calc(100dvh-2rem)] overflow-hidden p-0">
            <LoginPage />
          </DialogContent>
        </Dialog>
      );
    }
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
          <a href="/profile">???�로??</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/settings">?�정</a>
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
