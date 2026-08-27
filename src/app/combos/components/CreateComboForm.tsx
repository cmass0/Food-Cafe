"use client";

import { useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import type { ComboFormValues, ComboItems } from "@/domain/combo/types";
import ComboForm from "@/domain/combo/ui/ComboForm";
import { removeUploadedBucketImages, uploadBucketImage } from "@/lib/storage";
import { createComboAction } from "../actions";

function normalizeStoredImage(image: unknown): string | null | undefined {
  if (typeof image === "string") return image;
  if (image === null) return null;
  return undefined;
}

export default function CreateComboForm() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const uploadedPaths: string[] = [];
    let actionStarted = false;
    try {
      const comboId = crypto.randomUUID();
      const { path } = await uploadBucketImage("combos", user.id, comboId, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      });
      uploadedPaths.push(path);
      const storedImagePath = path;

      const itemResults = await Promise.allSettled(
        (values.items ?? []).map(async (item) => {
          if (item.type !== "product" || !(item.image instanceof File)) {
            return {
              item: { ...item, image: normalizeStoredImage(item.image) } as ComboItems,
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
      const insertItems: ComboItems[] = [];
      let itemUploadError: unknown;
      for (const result of itemResults) {
        if (result.status === "rejected") {
          itemUploadError ??= result.reason;
          continue;
        }
        if (result.value.path) uploadedPaths.push(result.value.path);
        insertItems.push(result.value.item);
      }
      if (itemUploadError) throw itemUploadError;
      actionStarted = true;
      await createComboAction(
        {
          ...values,
          items: insertItems,
          id: comboId,
          image: storedImagePath,
          difficulty: values.difficulty ?? "",
          time_minutes: values.time_minutes ?? 0,
        },
        uploadedPaths
      );
    } catch (err) {
      if (!actionStarted && uploadedPaths.length > 0) {
        await removeUploadedBucketImages(uploadedPaths).catch((rollbackError) => {
          console.error("조합 이미지 롤백에 실패했습니다.", rollbackError);
        });
      }
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
