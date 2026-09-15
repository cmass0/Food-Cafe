"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  changePasswordAction,
  phoneRegistrationAction,
  requestEmailChangeAction,
} from "@/app/auth/actions";
import AccountSecurityForm from "@/components/auth/AccountSecurityForm";
import type { ProfileRow } from "@/domain/user/types";
import { PencilLine } from "lucide-react";

import DeleteAccount from "./ui/DeleteAccount";
import EditName from "./ui/editname";
import EditPhoto from "./ui/editphoto";

type Props = {
  userProfile: ProfileRow;
  currentEmail: string;
  currentPhone?: string | null;
};

export default function EditSheet({ userProfile, currentEmail, currentPhone }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-12 gap-2 rounded-lg border-zinc-200 bg-white px-5 font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          <PencilLine className="h-4 w-4" aria-hidden="true" />내 정보 수정
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[92vw] sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>내 정보 수정</SheetTitle>
          <SheetDescription>프로필과 계정 정보를 한곳에서 관리할 수 있습니다.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid gap-8">
          <section className="grid gap-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">기본 정보</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                변경할 항목을 수정한 뒤 각 항목의 저장 버튼을 눌러 주세요.
              </p>
            </div>
            <EditPhoto userProfile={userProfile} />
            <EditName userProfile={userProfile} />
          </section>

          <section className="grid gap-5 border-t pt-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">계정 정보</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                이메일과 비밀번호처럼 로그인에 사용하는 정보를 변경합니다.
              </p>
            </div>
            <AccountSecurityForm
              currentEmail={currentEmail}
              currentPhone={currentPhone}
              emailAction={requestEmailChangeAction}
              passwordAction={changePasswordAction}
              phoneAction={phoneRegistrationAction}
            />
          </section>

          <section className="grid gap-3 border-t pt-6">
            <DeleteAccount userId={userProfile.id} />
          </section>

          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                닫기
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
