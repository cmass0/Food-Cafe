"use client";

import { useState } from "react";
import { useFormSuccess } from "@/components/forms/useFormSuccess";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ComboFormSchema } from "@/domain/combo/schema";
import type { ComboItems } from "@/domain/combo/types";
import ComboForm from "@/app/combos/ui/ComboForm";
import { removeUploadedBucketImages, uploadBucketImage } from "@/lib/storage";
import { z } from "zod";
import { updateComboAction } from "../actions";

export default function UpdateComboForm({
  comboId,
  defaultValues,
}: {
  comboId: string;
  defaultValues: z.infer<typeof ComboFormSchema>;
}) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const finish = useFormSuccess();
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

    setError(null);

    const uploadedPaths: string[] = [];
    let actionStarted = false;
    try {
      // File이면 새 상대 경로를, string이면 기존 이미지 참조를 사용한다.
      let finalImageReference: string | null = null;
      if (imageFile instanceof File) {
        const { path } = await uploadBucketImage("combos", user.id, comboId, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        });
        uploadedPaths.push(path);
        finalImageReference = path;
      } else {
        finalImageReference = imageFile;
      }

      if (!finalImageReference) {
        throw new Error("이미지를 가져오지 못했습니다.");
      }

      const itemResults = await Promise.allSettled(
        (values.items ?? []).map(async (item) => {
          if (item.type !== "product" || !(item.image instanceof File)) {
            return {
              item: {
                ...item,
                image: typeof item.image === "string" ? item.image : null,
              } as ComboItems,
              path: null,
            };
          }
          const uploaded = await uploadBucketImage("combos", user.id, comboId, item.image, {
            contentType: item.image.type,
            upsert: false,
          });
          return {
            item: { ...item, image: uploaded.path } as ComboItems,
            path: uploaded.path,
          };
        })
      );
      const insertValues: ComboItems[] = [];
      let itemUploadError: unknown;
      for (const result of itemResults) {
        if (result.status === "rejected") {
          itemUploadError ??= result.reason;
          continue;
        }
        if (result.value.path) uploadedPaths.push(result.value.path);
        insertValues.push(result.value.item);
      }
      if (itemUploadError) throw itemUploadError;

      actionStarted = true;
      await updateComboAction(
        comboId,
        {
          title: values.title,
          summary: values.summary,
          difficulty: values.difficulty,
          time_minutes: values.time_minutes,
          tags: values.tags,
          tools: values.tools,
          items: insertValues,
          steps: values.steps,
          image: finalImageReference,
        },
        uploadedPaths
      );

      finish(`/combos/${comboId}`, "edit");
    } catch (err) {
      if (!actionStarted && uploadedPaths.length > 0) {
        await removeUploadedBucketImages(uploadedPaths).catch((rollbackError) => {
          console.error("조합 이미지 롤백에 실패했습니다.", rollbackError);
        });
      }
      console.error("조합 수정/로딩과정에서 오류가 발생했습니다.", err);
      setError("수정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="space-y-2">
      <ComboForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        mode="edit"
        cancelHref={`/combos/${comboId}`}
        error={error}
      />
    </div>
  );
}
