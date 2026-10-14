import { FormSection } from "@/components/forms/FormSection";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { type FormValues } from "@/domain/recipe/types";
import { ImagePlus, X } from "lucide-react";
import { type ChangeEvent } from "react";
import { type UseFormReturn } from "react-hook-form";

const MAX_IMAGES = 10;

type ImageUploadFieldProps = {
  form: UseFormReturn<FormValues>;
  imagePreviews: string[];
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: (index: number) => void;
};

export function ImageUploadField({
  form,
  imagePreviews,
  handleFileChange,
  handleRemoveImage,
}: ImageUploadFieldProps) {
  return (
    <FormSection
      step={2}
      title="사진"
      description="첫 번째 사진이 대표 사진이 돼요. 완성된 요리 사진을 먼저 올려 주세요."
      aside={`${imagePreviews.length}/${MAX_IMAGES}장`}
    >
      <FormField
        control={form.control}
        name="imageFile"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">레시피 사진</FormLabel>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {imagePreviews.map((preview, index) => (
                <li
                  key={`${preview}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <img
                    src={preview}
                    alt={`레시피 이미지 미리보기 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded-md bg-green-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      대표
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label={`이미지 ${index + 1} 삭제`}
                    className="absolute right-1.5 top-1.5 size-7 rounded-full bg-background/90 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              ))}
              {imagePreviews.length < MAX_IMAGES ? (
                <li>
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors focus-within:ring-3 focus-within:ring-green-500/30 hover:border-green-400 hover:bg-green-50/50 hover:text-green-700 dark:hover:bg-green-950/30 dark:hover:text-green-400">
                    <ImagePlus className="size-6" aria-hidden="true" />
                    <span className="text-xs font-medium">사진 추가</span>
                    <FormControl>
                      <input
                        type="file"
                        aria-label="레시피 이미지"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(event) => {
                          handleFileChange(event);
                          const currentImages = form.getValues("imageFiles") ?? [];
                          field.onChange(currentImages[0] ?? null);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                  </label>
                </li>
              ) : null}
            </ul>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
