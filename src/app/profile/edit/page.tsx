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

import DeleteAccount from "./ui/DeleteAccount";
import EditEmail from "./ui/editemail";
import EditName from "./ui/editname";
import EditPhoto from "./ui/editphoto";

type Prps = {
  userProfile: UserRow;
};

export default function EditSheet({ userProfile }: Prps) {

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">프로필 수정</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>프로필 편집</SheetTitle>
          <SheetDescription>
            변경할 항목별로 저장 버튼을 눌러 업데이트할 수 있습니다.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 grid gap-6">
          <EditPhoto userProfile={userProfile} />
          <EditName userProfile={userProfile} />
          <EditEmail userProfile={userProfile} />

          {/* 위험 구역 — 위쪽 편집 섹션과 구분선으로 분리 */}
          <div className="border-t pt-4">
            <DeleteAccount userId={userProfile.id} />
          </div>

          <SheetFooter className="mt-2">
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
