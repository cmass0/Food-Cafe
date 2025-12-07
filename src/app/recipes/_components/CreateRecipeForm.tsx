"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/features/auth/ui/AuthModalProvider";
import RecipeForm from "@/features/recipe/ui/RecipeForm";
import type { RecipeInsertInput } from "@/features/recipe/types";
import { createRecipe } from "@/features/recipe/api";
import { uploadRecipeImage } from "@/lib/storage";
import { getBrowserSupabase } from "@/lib/supabase";

export default function CreateRecipeForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: RecipeInsertInput, extras?: { imageFile: File | null }) => {
    if (!user) {
      openAuthModal({ next: "/recipes/new" });
      return;
    }

    const imageFile = extras?.imageFile ?? null;
    if (!imageFile) {
      setError("대표 이미지를 파일로 올려주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = getBrowserSupabase();

    try {
      const recipeId = crypto.randomUUID();
      const { publicUrl, signedUrl } = await uploadRecipeImage(supabase, recipeId, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      });
      const finalUrl = publicUrl ?? signedUrl ?? null;
      if (!finalUrl) {
        throw new Error("이미지 URL 생성에 실패했습니다.");
      }

      const created = await createRecipe({
        ...values,
        id: recipeId,
        image: finalUrl,
      });

      router.push(`/recipes/${created.id}`);
    } catch (err) {
      console.error("레시피 등록/업로드 과정에서 오류가 발생했습니다.", err);
      setError("등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <RecipeForm
        enableImageUpload
        requireImageUpload
        onSubmit={handleSubmit}
        submitLabel={submitting ? "등록 중..." : "레시피 등록"}
      />
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
