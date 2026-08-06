"use client";

import { useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import type { RecipeInsertDB } from "@/domain/recipe/types";
import RecipeForm from "@/domain/recipe/ui/RecipeForm";

import { uploadBucketImage } from "@/lib/storage";
import { createRecipeAction } from "../actions";

export default function CreateRecipeForm() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    values: RecipeInsertDB,
    extras?: { imageFiles: Array<File | string> }
  ) => {
    if (!user) {
      openAuthModal({ next: "/recipes/new" });
      return;
    }

    const imageFiles = extras?.imageFiles ?? [];
    const uploadFiles = imageFiles.filter(
      (imageFile): imageFile is File => imageFile instanceof File
    );

    if (uploadFiles.length === 0) {
      setError("대표 이미지 파일을 선택해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const recipeId = crypto.randomUUID();
      const uploadedImages = await Promise.all(
        uploadFiles.map(async (imageFile) => {
          const { publicUrl, signedUrl } = await uploadBucketImage(
            "recipes",
            user.id,
            recipeId,
            imageFile,
            {
              contentType: imageFile.type,
              upsert: false,
            }
          );
          return publicUrl ?? signedUrl ?? null;
        })
      );
      const imageUrls = uploadedImages.filter((url): url is string => Boolean(url));
      const representativeImage = imageUrls[0] ?? null;
      if (!representativeImage) {
        throw new Error("이미지 URL 생성에 실패했습니다.");
      }

      await createRecipeAction({
        ...values,
        id: recipeId,
        image: representativeImage,
        images: imageUrls,
      });
    } catch (err) {
      console.error("레시피 등록 과정에서 오류가 발생했습니다.", err);
      setError("등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <RecipeForm onSubmit={handleSubmit} submitLabel={submitting ? "등록 중..." : "레시피 등록"} />
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
