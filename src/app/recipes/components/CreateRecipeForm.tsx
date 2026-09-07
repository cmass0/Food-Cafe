"use client";

import { useState } from "react";
import { useFormSuccess } from "@/components/forms/useFormSuccess";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import type { RecipeInsertDB } from "@/domain/recipe/types";
import RecipeForm from "@/domain/recipe/ui/RecipeForm";

import { removeUploadedBucketImages, uploadBucketImage } from "@/lib/storage";
import { createRecipeAction } from "../actions";

export default function CreateRecipeForm() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const finish = useFormSuccess();
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

    setError(null);

    const uploadedPaths: string[] = [];
    let actionStarted = false;
    try {
      const recipeId = crypto.randomUUID();
      const uploadResults = await Promise.allSettled(
        uploadFiles.map((imageFile) =>
          uploadBucketImage("recipes", user.id, recipeId, imageFile, {
            contentType: imageFile.type,
            upsert: false,
          })
        )
      );
      const storedImagePaths: string[] = [];
      let uploadError: unknown;
      for (const result of uploadResults) {
        if (result.status === "rejected") {
          uploadError ??= result.reason;
          continue;
        }
        uploadedPaths.push(result.value.path);
        storedImagePaths.push(result.value.path);
      }
      if (uploadError) throw uploadError;
      const representativeImage = storedImagePaths[0] ?? null;
      if (!representativeImage) {
        throw new Error("업로드된 이미지 경로를 확인하지 못했습니다.");
      }

      actionStarted = true;
      const saved = await createRecipeAction(
        {
          ...values,
          id: recipeId,
          image: representativeImage,
          images: storedImagePaths,
        },
        uploadedPaths
      );
      finish(`/recipes/${saved.id}`, "create");
    } catch (err) {
      if (!actionStarted && uploadedPaths.length > 0) {
        await removeUploadedBucketImages(uploadedPaths).catch((rollbackError) => {
          console.error("레시피 이미지 롤백에 실패했습니다.", rollbackError);
        });
      }
      console.error("레시피 등록 과정에서 오류가 발생했습니다.", err);
      setError("등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="space-y-2">
      <RecipeForm onSubmit={handleSubmit} mode="create" cancelHref="/recipes" error={error} />
    </div>
  );
}
