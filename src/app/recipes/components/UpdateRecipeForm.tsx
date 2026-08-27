"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import type { RecipeInsertDB } from "@/domain/recipe/types";
import RecipeForm from "@/domain/recipe/ui/RecipeForm";
import { removeUploadedBucketImages, uploadBucketImage } from "@/lib/storage";
import { updateRecipeAction } from "../actions";

type Props = {
  recipeId: string;
  defaultValues: Partial<RecipeInsertDB>;
};

export default function UpdateRecipeForm({ recipeId, defaultValues }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    values: RecipeInsertDB,
    extras?: { imageFiles: Array<File | string> }
  ) => {
    if (!user) {
      openAuthModal({ next: `/recipes/edit?id=${recipeId}` });
      return;
    }

    const imageFiles = extras?.imageFiles ?? [];
    if (imageFiles.length === 0) {
      setError("이미지를 선택해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const uploadedPaths: string[] = [];
    let actionStarted = false;
    try {
      const uploadResults = await Promise.allSettled(
        imageFiles.map(async (imageFile) => {
          if (!(imageFile instanceof File)) return { path: null, reference: imageFile };
          const uploaded = await uploadBucketImage("recipes", user.id, recipeId, imageFile, {
            contentType: imageFile.type,
            upsert: false,
          });
          return {
            path: uploaded.path,
            reference: uploaded.path,
          };
        })
      );
      const imageReferences: Array<string | null> = [];
      let uploadError: unknown;
      for (const result of uploadResults) {
        if (result.status === "rejected") {
          uploadError ??= result.reason;
          continue;
        }
        if (result.value.path) uploadedPaths.push(result.value.path);
        imageReferences.push(result.value.reference);
      }
      if (uploadError) throw uploadError;
      const finalReferences = imageReferences.filter((reference): reference is string =>
        Boolean(reference)
      );
      const representativeImage = finalReferences[0] ?? null;

      if (!representativeImage) {
        throw new Error("이미지를 가져오지 못했습니다.");
      }

      actionStarted = true;
      await updateRecipeAction(
        recipeId,
        {
          title: values.title,
          summary: values.summary,
          chef_tip: values.chef_tip,
          steps: values.steps,
          ingredients: values.ingredients,
          image: representativeImage,
          images: finalReferences,
          tags: values.tags,
          tools: values.tools,
          tools_required: (values.tools?.length ?? 0) > 0,
          category: values.category,
          difficulty: values.difficulty,
          time_minutes: values.time_minutes,
          servings: values.servings,
        },
        uploadedPaths
      );
      router.refresh();
      router.push(`/recipes/${recipeId}`);
    } catch (err) {
      if (!actionStarted && uploadedPaths.length > 0) {
        await removeUploadedBucketImages(uploadedPaths).catch((rollbackError) => {
          console.error("레시피 이미지 롤백에 실패했습니다.", rollbackError);
        });
      }
      console.error("레시피 수정 과정에서 오류가 발생했습니다.", err);
      setError("수정에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <RecipeForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel={submitting ? "수정 중..." : "수정하기"}
      />
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
