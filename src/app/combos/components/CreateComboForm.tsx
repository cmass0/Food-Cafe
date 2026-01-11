"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { createCombo } from "@/domain/combo/api";
import { ComboFormSchema } from "@/domain/combo/schema";
import ComboForm from "@/domain/combo/ui/ComboForm";
import { uploadBucketImage } from "@/lib/storage";
import { z } from "zod";

export default function CreateComboForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type ComboFormValues = z.input<typeof ComboFormSchema>;

  const handleSubmit = async (
    values: ComboFormValues,
    extras?: { imageFile: File | string | null }
  ) => {
    if (!user) {
      openAuthModal({ next: "/combos/new" });
      return;
    }

    const imageFile = extras?.imageFile ?? null;
    // 생성 시에는 반드시 File이어야 함
    if (!imageFile || !(imageFile instanceof File)) {
      setError("이미지 파일을 선택해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const comboId = crypto.randomUUID();
      const { publicUrl, signedUrl } = await uploadBucketImage(
        "combos",
        user.id,
        comboId,
        imageFile,
        {
          contentType: imageFile.type,
          upsert: false,
        }
      );
      const finalUrl = publicUrl ?? signedUrl ?? null;
      if (!finalUrl) {
        throw new Error("이미지 를 가져오지 못했습니다.");
      }

      const Insertvalues = (
        await Promise.all(
          (values.items ?? []).map(async (item) => {
            if (item.type === "product" && item.image && item.image instanceof File) {
              const { publicUrl } = await uploadBucketImage(
                "combos",
                user.id,
                comboId,
                item.image,
                {
                  contentType: item.image.type,
                  upsert: false,
                }
              );
              return {
                ...item,
                image: publicUrl ?? null,
              };
            }
            return item;
          })
        )
      ).filter(Boolean);
      const created = await createCombo({
        ...values,
        writerUid: user.id,
        items: Insertvalues,
        id: comboId,
        image: finalUrl,
      });

      router.push(`/combos/${created.id}`);
    } catch (err) {
      console.error("조합 등록/로딩과정에서 오류가 발생했습니다.", err);
      setError("등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <ComboForm onSubmit={handleSubmit} submitLabel={submitting ? "등록 중.." : "조합 등록"} />
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
