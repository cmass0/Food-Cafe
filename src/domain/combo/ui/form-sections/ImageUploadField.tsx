"use client";

import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChangeEvent, useEffect, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { ComboFormValues } from "../../types";

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
    <div className="space-y-4 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">대표 이미지</h3>
        <span className="text-xs text-muted-foreground">가로형 이미지 권장</span>
      </div>
      <FormField
        control={form.control}
        name="image"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 bg-background p-4 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative h-32 w-full overflow-hidden rounded-md border bg-muted/30 md:w-40">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="대표 이미지 미리보기"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      대표 이미지 미리보기
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <FormControl>
                    <Input
                      type="file"
                      aria-label="대표 이미지"
                      accept="image/*"
                      onChange={(event) => {
                        handleFileChange(event);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    로컬 이미지를 올리면 미리보기가 보이고, 서버 업로드 URL도 사용할 수 있어요.
                  </p>
                  <FormMessage />
                </div>
              </div>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
