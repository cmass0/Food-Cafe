"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import type { RecipeInsertDB } from "@/domain/recipe/types";
import RecipeForm from "@/domain/recipe/ui/RecipeForm";
import { uploadBucketImage } from "@/lib/storage";
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

    try {
      const imageUrls = await Promise.all(
        imageFiles.map(async (imageFile) => {
          if (imageFile instanceof File) {
            const { publicUrl, signedUrl } = await uploadBucketImage(
              "recipes",
              user.id,
              recipeId,
              imageFile,
              {
                contentType: imageFile.type,
                upsert: true,
              }
            );
            return publicUrl ?? signedUrl ?? null;
          }

          return imageFile;
        })
      );
      const finalUrls = imageUrls.filter((url): url is string => Boolean(url));
      const finalUrl = finalUrls[0] ?? null;

      if (!finalUrl) {
        throw new Error("이미지를 가져오지 못했습니다.");
      }

      await updateRecipeAction(recipeId, {
        title: values.title,
        summary: values.summary,
        chef_tip: values.chef_tip,
        steps: values.steps,
        ingredients: values.ingredients,
        image: finalUrl,
        images: finalUrls,
        tags: values.tags,
        tools: values.tools,
        tools_required: (values.tools?.length ?? 0) > 0,
        category: values.category,
        difficulty: values.difficulty,
        time_minutes: values.time_minutes,
        servings: values.servings,
      });
      router.refresh();
      router.push(`/recipes/${recipeId}`);
    } catch (err) {
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
