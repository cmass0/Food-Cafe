"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { ComboFormSchema } from "@/domain/combo/schema";
import type { ComboItems } from "@/domain/combo/types";
import ComboForm from "@/domain/combo/ui/ComboForm";
import { uploadBucketImage } from "@/lib/storage";
import { z } from "zod";
import { updateComboAction } from "../actions";

export default function UpdateComboForm({
  comboId,
  defaultValues,
}: {
  comboId: string;
  defaultValues: z.infer<typeof ComboFormSchema>;
}) {
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
      openAuthModal({ next: `/combos/edit?id=${comboId}` });
      return;
    }

    const imageFile = extras?.imageFile ?? null;
    if (!imageFile) {
      setError("이미지를 선택해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // File이면 업로드, string이면 기존 URL 그대로 사용
      let finalUrl: string | null = null;
      if (imageFile instanceof File) {
        const { publicUrl, signedUrl } = await uploadBucketImage(
          "combos",
          user.id,
          comboId,
          imageFile,
          {
            contentType: imageFile.type,
            upsert: true,
          }
        );
        finalUrl = publicUrl ?? signedUrl ?? null;
      } else {
        // 기존 string URL 그대로 사용
        finalUrl = imageFile;
      }

      if (!finalUrl) {
        throw new Error("이미지를 가져오지 못했습니다.");
      }

      const Insertvalues: ComboItems[] = (
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
                  upsert: true,
                }
              );
              return {
                ...item,
                image: publicUrl ?? null,
              } as ComboItems;
            }
            // 기존 string이나 null인 경우 그대로 반환
            return {
              ...item,
              image: typeof item.image === "string" ? item.image : null,
            } as ComboItems;
          })
        )
      ).filter(Boolean);

      await updateComboAction(comboId, {
        title: values.title,
        summary: values.summary,
        difficulty: values.difficulty,
        time_minutes: values.time_minutes,
        tags: values.tags,
        tools: values.tools,
        items: Insertvalues,
        steps: values.steps,
        image: finalUrl,
      });

      router.refresh();
      router.push(`/combos/${comboId}`);
    } catch (err) {
      console.error("조합 수정/로딩과정에서 오류가 발생했습니다.", err);
      setError("수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <ComboForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel={submitting ? "수정 중.." : "조합 수정"}
      />
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
