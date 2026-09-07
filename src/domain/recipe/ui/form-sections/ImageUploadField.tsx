import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { type ChangeEvent } from "react";
import { type UseFormReturn } from "react-hook-form";
import { type FormValues } from "../../types";

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
    <div className="space-y-4 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">대표 이미지</h3>
        <span className="text-xs text-muted-foreground">
          {imagePreviews.length}/10장, 첫 번째 이미지가 대표로 저장됩니다
        </span>
      </div>
      <FormField
        control={form.control}
        name="imageFile"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 bg-background p-4 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="grid w-full grid-cols-2 gap-2 md:w-80 md:grid-cols-3">
                  {imagePreviews.length > 0 ? (
                    imagePreviews.map((preview, index) => (
                      <div
                        key={`${preview}-${index}`}
                        className="relative h-28 overflow-hidden rounded-md border bg-muted/30"
                      >
                        <img
                          src={preview}
                          alt={`레시피 이미지 미리보기 ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {index === 0 ? (
                          <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                            대표
                          </span>
                        ) : null}
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          aria-label={`이미지 ${index + 1} 삭제`}
                          className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full bg-background/80 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex h-32 w-full items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
                      이미지 미리보기
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <FormControl>
                    <Input
                      type="file"
                      aria-label="레시피 이미지"
                      accept="image/*"
                      multiple
                      disabled={imagePreviews.length >= 10}
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
                  <p className="text-xs text-muted-foreground">
                    이미지를 선택할 때마다 목록에 추가됩니다. 각 이미지의 X 버튼으로 저장 대상에서
                    제외할 수 있습니다.
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
