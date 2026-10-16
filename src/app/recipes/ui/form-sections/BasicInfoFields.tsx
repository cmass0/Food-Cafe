import { ChipPreview, ChoiceChips } from "@/components/forms/ChoiceChips";
import { FormSection, OptionalMark } from "@/components/forms/FormSection";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RECIPE_CATEGORIES } from "@/domain/recipe/category";
import { MAX_RECIPE_TAGS, RECIPE_TEXT_LIMITS } from "@/domain/recipe/schema";
import { type FormValues } from "@/domain/recipe/types";
import { type Dispatch, type SetStateAction, useId } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

type BasicInfoFieldsProps = {
  form: UseFormReturn<FormValues>;
  tagsInput: string;
  setTagsInput: Dispatch<SetStateAction<string>>;
  normalizeTags: (text: string) => string[];
};

export function BasicInfoFields({
  form,
  tagsInput,
  setTagsInput,
  normalizeTags,
}: BasicInfoFieldsProps) {
  const categoryLabelId = useId();
  const summary = useWatch({ control: form.control, name: "summary" });
  const tags = normalizeTags(tagsInput);

  return (
    <FormSection step={1} title="기본 정보" description="목록과 검색에 보이는 정보예요.">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>레시피 제목</FormLabel>
            <FormControl>
              <Input
                placeholder="예) 10분 완성 새우 크림 파스타"
                maxLength={RECIPE_TEXT_LIMITS.title}
                {...field}
              />
            </FormControl>
            <FormDescription>검색이 잘 되도록 요리 이름을 넣어 주세요.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              한 줄 소개
              <OptionalMark />
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="예) 버터 향이 진한 크림소스에 통통한 새우를 듬뿍 넣었어요."
                rows={2}
                maxLength={RECIPE_TEXT_LIMITS.summary}
                className="resize-none bg-background"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <div className="flex justify-between gap-3">
              <FormMessage />
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {(summary ?? "").length}/{RECIPE_TEXT_LIMITS.summary}
              </span>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel id={categoryLabelId}>
              카테고리
              <OptionalMark />
            </FormLabel>
            <FormControl>
              <ChoiceChips
                aria-labelledby={categoryLabelId}
                options={RECIPE_CATEGORIES}
                value={field.value}
                onValueChange={field.onChange}
                allowDeselect
                firstChipRef={field.ref}
                onChipBlur={field.onBlur}
              />
            </FormControl>
            <FormDescription>홈 화면 카테고리에서 이 레시피를 찾을 수 있어요.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between gap-3">
              <FormLabel>
                태그
                <OptionalMark />
              </FormLabel>
              <span className="text-xs tabular-nums text-muted-foreground">
                {tags.length}/{MAX_RECIPE_TAGS}
              </span>
            </div>
            <FormControl>
              <Input
                placeholder="예) 10분, 칼칼한, 술안주"
                ref={field.ref}
                onBlur={field.onBlur}
                name={field.name}
                value={tagsInput}
                onChange={(event) => {
                  const next = event.target.value;
                  setTagsInput(next);
                  field.onChange(normalizeTags(next));
                }}
              />
            </FormControl>
            <FormDescription>쉼표(,)로 구분해 적어 주세요.</FormDescription>
            <ChipPreview items={tags} prefix="#" />
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
