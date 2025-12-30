import { FormField, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type ChangeEvent } from "react";
import { type UseFormReturn } from "react-hook-form";
import z from "zod";
import { ComboFormSchema } from "../../schema";

type ImageUploadFieldProps = {
  form: UseFormReturn<z.infer<typeof ComboFormSchema>>;
  imagePreview: string | null;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function ComboImageUploadField({
  form,
  imagePreview,
  handleFileChange,
}: ImageUploadFieldProps) {
  return (
    <div className="space-y-4 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">대표 이미지</h3>
        <span className="text-xs text-muted-foreground">가로형 이미지 권장</span>
      </div>
      <FormField
        control={form.control}
        name="imageFile"
        render={({ field }) => (
          <div className="space-y-4">
            <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 bg-background p-4 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative h-32 w-full overflow-hidden rounded-md border bg-muted/30 md:w-40">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
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
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      handleFileChange(event);
                      const nextFile = event.target.files?.[0] ?? null;
                      field.onChange(nextFile);
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                  <p className="text-xs text-muted-foreground">
                    로컬 이미지를 올리면 미리보기가 보이고, 서버 업로드 URL도 사용할 수 있어요.
                  </p>
                  <FormMessage />
                </div>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
