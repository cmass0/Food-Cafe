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
import { UserRow } from "@/domain/user/types";
import { PencilLine } from "lucide-react";

import DeleteAccount from "./ui/DeleteAccount";
import EditEmail from "./ui/editemail";
import EditName from "./ui/editname";
import EditPhoto from "./ui/editphoto";

type Props = {
  userProfile: UserRow;
};

export default function EditSheet({ userProfile }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-12 gap-2 rounded-lg border-zinc-200 bg-white px-5 font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          프로필 수정
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>프로필 편집</SheetTitle>
          <SheetDescription>프로필 이미지, 닉네임, 이메일을 변경할 수 있습니다.</SheetDescription>
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
            <EditEmail userProfile={userProfile} />
          </section>

          <section className="grid gap-3 border-t pt-6">
            {/* <div>
              <h3 className="text-sm font-semibold text-foreground">계정 관리</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                계정 삭제는 되돌릴 수 없으니 신중하게 진행해 주세요.
              </p>
            </div> */}
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
