"use client";

import { User } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileRow } from "@/domain/user/types";
import { uploadBucketImage } from "@/lib/storage";

import { updateProfileAction } from "../../actions";

type Props = {
  userProfile: ProfileRow;
};

export default function EditPhoto({ userProfile }: Props) {
  const { supabase } = useAuth();
  const [photoUrl, setPhotoUrl] = useState(userProfile.photo_url ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);
  const [imageSaving, setImageSaving] = useState(false);

  const handlePhotoUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoUrl(event.target.value);
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    if (!file) {
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImageError(null);
    setImageSuccess(null);

    let nextUrl = photoUrl.trim();

    try {
      setImageSaving(true);
      if (imageFile) {
        const { publicUrl, signedUrl } = await uploadBucketImage(
          "avatars",
          userProfile.id,
          userProfile.id,
          imageFile,
          {
            contentType: imageFile.type,
            upsert: false,
          }
        );
        const uploadedUrl = publicUrl ?? signedUrl ?? null;
        if (!uploadedUrl) {
          throw new Error("이미지 URL 생성에 실패했습니다.");
        }
        nextUrl = uploadedUrl;
      }

      if (!nextUrl) {
        setImageError("이미지 URL을 입력하거나 파일을 선택해주세요.");
        return;
      }

      const formData = new FormData();
      formData.set("photo_url", nextUrl);
      await updateProfileAction(formData);
      await supabase.auth.updateUser({
        data: {
          avatar_url: nextUrl,
          photo_url: nextUrl,
        },
      });
      setPhotoUrl(nextUrl);
      setImageFile(null);
      setImagePreview(null);
      setImageSuccess("프로필 이미지가 변경되었습니다.");
    } catch (error) {
      console.error("프로필 이미지 변경에 실패했습니다.", error);
      setImageError("프로필 이미지 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setImageSaving(false);
    }
  };

  return (
    <form onSubmit={handleImageSubmit} className="grid gap-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border bg-background">
            {imagePreview ? (
              <AvatarImage src={imagePreview} alt="프로필 이미지" />
            ) : photoUrl ? (
              <AvatarImage src={photoUrl} alt="프로필 이미지" />
            ) : (
              <User className="h-8 w-8" />
            )}
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Label htmlFor="photo_file">프로필 이미지 파일</Label>
            <Input
              id="photo_file"
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="mt-2"
            />
            <Label htmlFor="photo_url" className="mt-4 block">
              프로필 이미지 URL (선택)
            </Label>
            <Input
              id="photo_url"
              type="url"
              value={photoUrl}
              onChange={handlePhotoUrlChange}
              className="mt-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              파일을 선택하거나 이미지 URL을 입력해주세요.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {imageError ? (
            <p className="text-sm text-red-500">{imageError}</p>
          ) : imageSuccess ? (
            <p className="text-sm font-bold">{imageSuccess}</p>
          ) : (
            <div />
          )}
          <Button className="justify-end" type="submit" disabled={imageSaving}>
            {imageSaving ? "이미지 변경 중..." : "이미지 변경"}
          </Button>
        </div>
      </div>
    </form>
  );
}
