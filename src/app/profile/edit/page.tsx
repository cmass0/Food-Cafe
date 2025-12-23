"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { UserRow } from "@/features/user/types";

import { User } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { updateProfileAction } from "../actions";

type Prps = {
  userProfile: UserRow;
};

export default function EditSheet({ userProfile }: Prps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const handleEditImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">프로필 수정</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>프로필 편집</SheetTitle>
          <SheetDescription>
            프로필을 변경해 주세요. 변경사항 입력이 끝나시면 하단의 저장 버튼을 눌러주세요.
          </SheetDescription>
        </SheetHeader>
        <form action={updateProfileAction} className="mt-6 grid gap-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <Avatar className="h-16 w-16 border bg-background">
                  {imagePreview ? (
                    <AvatarImage src={imagePreview} alt="프로필 이미지" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-16 w-16 border bg-background">
                  {userProfile.photo_url ? (
                    <AvatarImage src={userProfile.photo_url} alt="프로필 이미지" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <Label htmlFor="photo_url">프로필 이미지 URL</Label>
                <Input
                  id="photo_url"
                  type="file"
                  name="photo_url"
                  onChange={(event) => {
                    handleEditImageChange(event);
                  }}
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  이미지 파일 또는 주소를 입력해주세요.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="display_name">이름</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={userProfile.display_name ?? ""}
                placeholder="변경할 이름을 입력하세요"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={userProfile.email ?? ""}
                placeholder="변경할 이메일을 입력하세요"
              />
              <p className="text-xs text-muted-foreground">
                이메일 변경 시 인증 메일이 발송됩니다.
              </p>
              {/* <Button type="submit">인증 메일받기</Button> */}
            </div>
          </div>
          <SheetFooter className="mt-2">
            <Button type="submit">변경사항 저장</Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                닫기
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
