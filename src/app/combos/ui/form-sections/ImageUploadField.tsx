"use client";

import { FormSection } from "@/components/forms/FormSection";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ComboFormValues } from "@/domain/combo/types";
import { ImagePlus } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { type UseFormReturn } from "react-hook-form";

type ImageUploadFieldProps = {
  form: UseFormReturn<ComboFormValues>;
};

export function ComboImageUploadField({ form }: ImageUploadFieldProps) {
  // 기존 이미지 URL이 있으면 초기 미리보기로 설정
  const existingImage = form.getValues("image");
  const initialPreview = typeof existingImage === "string" ? existingImage : null;
  const [imagePreview, setImagePreview] = useState<string | null>(initialPreview);
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // 이미지 파일 변경 처리
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      // 파일 선택창만 닫은 경우 이전 선택을 그대로 유지한다.
      return;
    }

    form.setValue("image", file, {
      shouldDirty: true,
      shouldValidate: form.formState.submitCount > 0,
    });
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <FormSection
      step={2}
      title="대표 사진"
      description="조합 목록과 상세 화면 맨 위에 보여요. 가로로 긴 사진을 추천해요."
    >
      <FormField
        control={form.control}
        name="image"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">대표 사진</FormLabel>
            <label className="relative flex aspect-[16/9] w-full max-w-xl cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors focus-within:ring-3 focus-within:ring-green-500/30 hover:border-green-400 hover:bg-green-50/50 hover:text-green-700 dark:hover:bg-green-950/30 dark:hover:text-green-400">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="대표 이미지 미리보기"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute bottom-3 right-3 rounded-lg bg-black/65 px-2.5 py-1 text-xs font-medium text-white">
                    사진 바꾸기
                  </span>
                </>
              ) : (
                <span className="flex flex-col items-center gap-1.5">
                  <ImagePlus className="size-7" aria-hidden="true" />
                  <span className="text-sm font-medium">사진 올리기</span>
                </span>
              )}
              <FormControl>
                <input
                  type="file"
                  aria-label="대표 이미지"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
            </label>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
