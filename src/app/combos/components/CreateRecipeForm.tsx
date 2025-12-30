"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { createCombo } from "@/domain/combo/api";
import { ComboInsertDb } from "@/domain/combo/types";
import ComboForm from "@/domain/combo/ui/ComboForm";
import { uploadBucketImage } from "@/lib/storage";
import { getBrowserSupabase } from "@/lib/supabase";

export default function CreateRecipeForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ComboInsertDb, extras?: { imageFile: File | null }) => {
    if (!user) {
      openAuthModal({ next: "/combos/new" });
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
      const comboId = crypto.randomUUID();
      const { publicUrl, signedUrl } = await uploadBucketImage(
        supabase,
        "combos",
        comboId,
        imageFile,
        {
          contentType: imageFile.type,
          upsert: false,
        }
      );
      const finalUrl = publicUrl ?? signedUrl ?? null;
      if (!finalUrl) {
        throw new Error("이미지 URL 생성에 실패했습니다.");
      }

      const created = await createCombo({
        ...values,
        id: comboId,
        image: finalUrl,
      });

      router.push(`/combos/${created.id}`);
    } catch (err) {
      console.error("레시피 조합 등록/업로드 과정에서 오류가 발생했습니다.", err);
      setError("등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <ComboForm
        onSubmit={handleSubmit}
        submitLabel={submitting ? "등록 중..." : "레시피 조합 등록"}
      />
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
