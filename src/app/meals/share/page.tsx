"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/features/auth/ui/AuthModalProvider";
import RecipeForm from "@/features/recipe/ui/RecipeForm";
import type { RecipeInsertInput } from "@/features/recipe/types";
import { createRecipe, updateRecipe } from "@/features/recipe/api";
import { uploadRecipeImage } from "@/lib/storage";
import { getBrowserSupabase } from "@/lib/supabase";

import style from "./page.module.css";

export default function ShareMeal() {
  const router = useRouter();
  const { user, displayName } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: RecipeInsertInput, extras?: { imageFile: File | null }) => {
    console.log("클릭");
    if (!user) {
      console.log("클릭1");
      openAuthModal({ next: "/meals/share" });
      return;
    }

    const imageFile = extras?.imageFile ?? null;
    const imageUrl = values.image?.trim() || "";

    if (!imageFile && !imageUrl) {
      console.log("클릭2");
      setError("대표 이미지를 업로드하거나 URL을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = getBrowserSupabase();

    try {
      const created = await createRecipe({
        ...values,
        image: imageUrl || null,
        writerName: displayName ?? user.email ?? "user",
        writerUid: user.id,
        writerEmail: user.email ?? undefined,
      });

      if (imageFile) {
        const { publicUrl, signedUrl } = await uploadRecipeImage(supabase, created.id, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        });
        const finalUrl = publicUrl ?? signedUrl ?? null;
        if (finalUrl) {
          await updateRecipe(created.id, { image: finalUrl });
        }
      }

      router.push("/meals");
    } catch (err) {
      console.error("레시피 생성/업로드 중 오류가 발생했습니다.", err);
      setError("업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={style.pagecontainer}>
      <header className={style.header}>
        <h1>맛있는 경험, 함께 나눠요</h1>
        <p className={style.subtitle}>
          나만의 꿀조합을 공유하고, 다른 사람들의 아이디어도 구경하세요.
        </p>
      </header>

      <main className={style.shareform}>
        <RecipeForm
          enableImageUpload
          requireImageUpload
          onSubmit={handleSubmit}
          submitLabel={submitting ? "공유 중..." : "레시피 공유하기"}
        />
        {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
      </main>
    </div>
  );
}
