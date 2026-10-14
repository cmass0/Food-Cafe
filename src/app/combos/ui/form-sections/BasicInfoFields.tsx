import { ChipPreview } from "@/components/forms/ChoiceChips";
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
import { COMBO_TEXT_LIMITS, MAX_COMBO_TAGS } from "@/domain/combo/schema";
import { ComboFormValues } from "@/domain/combo/types";
import { Dispatch, SetStateAction } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

type BasicInfoFieldsProps = {
  form: UseFormReturn<ComboFormValues>;
  tagsInput: string;
  setTagsInput: Dispatch<SetStateAction<string>>;
  normalizeTags: (text: string) => string[];
};

export function ComboBasicInfoFields({
  form,
  tagsInput,
  setTagsInput,
  normalizeTags,
}: BasicInfoFieldsProps) {
  const summary = useWatch({ control: form.control, name: "summary" });
  const tags = normalizeTags(tagsInput);

  return (
    <FormSection step={1} title="기본 정보" description="목록과 검색에 보이는 정보예요.">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>조합 제목</FormLabel>
            <FormControl>
              <Input
                placeholder="예) 편의점 컵라면 꿀조합 한 끼"
                maxLength={COMBO_TEXT_LIMITS.title}
                {...field}
              />
            </FormControl>
            <FormDescription>어떤 조합인지 한눈에 알 수 있게 적어 주세요.</FormDescription>
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
                placeholder="예) 매콤한 컵라면에 계란말이를 곁들여 든든하게 먹는 조합이에요."
                rows={2}
                maxLength={COMBO_TEXT_LIMITS.summary}
                className="resize-none bg-background"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <div className="flex justify-between gap-3">
              <FormMessage />
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {(summary ?? "").length}/{COMBO_TEXT_LIMITS.summary}
              </span>
            </div>
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
                {tags.length}/{MAX_COMBO_TAGS}
              </span>
            </div>
            <FormControl>
              <Input
                placeholder="예) 편의점, 야식, 자취"
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
