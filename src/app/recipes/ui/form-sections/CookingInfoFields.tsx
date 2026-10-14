import { ChipPreview, ChoiceChips } from "@/components/forms/ChoiceChips";
import { FormSection, OptionalMark } from "@/components/forms/FormSection";
import { SuffixInput } from "@/components/forms/SuffixInput";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { difficultyLabels, getDifficultyMeta } from "@/domain/recipe/difficulty";
import { MAX_RECIPE_TOOLS } from "@/domain/recipe/schema";
import { type FormValues } from "@/domain/recipe/types";
import { formatMinutes } from "@/lib/format-duration";
import { type Dispatch, type SetStateAction, useId } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

type CookingInfoFieldsProps = {
  form: UseFormReturn<FormValues>;
  toolsInput: string;
  setToolsInput: Dispatch<SetStateAction<string>>;
  normalizeTools: (text: string) => string[];
};

export function CookingInfoFields({
  form,
  toolsInput,
  setToolsInput,
  normalizeTools,
}: CookingInfoFieldsProps) {
  const difficultyLabelId = useId();
  const minutes = useWatch({ control: form.control, name: "time_minutes" });
  const difficulty = getDifficultyMeta(useWatch({ control: form.control, name: "difficulty" }));
  const tools = normalizeTools(toolsInput);
  const minutesLabel = typeof minutes === "number" && minutes >= 60 ? formatMinutes(minutes) : null;

  return (
    <FormSection
      step={3}
      title="요리 정보"
      description="몇 인분인지, 얼마나 걸리고 어려운지 알려 주세요."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="servings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>인분</FormLabel>
              <FormControl>
                <SuffixInput
                  suffix="인분"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  name={field.name}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="50"
                  step="1"
                  placeholder="2"
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                조리 시간
                <OptionalMark />
              </FormLabel>
              <FormControl>
                <SuffixInput
                  suffix="분"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  name={field.name}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="30"
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                {minutesLabel ? `= ${minutesLabel}` : "분 단위로 적어 주세요. 예) 1시간 30분은 90"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="difficulty"
        render={({ field }) => (
          <FormItem>
            <FormLabel id={difficultyLabelId}>
              난이도
              <OptionalMark />
            </FormLabel>
            <FormControl>
              <ChoiceChips
                aria-labelledby={difficultyLabelId}
                options={difficultyLabels}
                value={field.value}
                onValueChange={field.onChange}
                allowDeselect
                firstChipRef={field.ref}
                onChipBlur={field.onBlur}
              />
            </FormControl>
            <FormDescription>
              {difficulty
                ? `${difficulty.description} 추천: ${difficulty.recommend}`
                : "난이도를 고르면 설명이 보여요."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tools"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between gap-3">
              <FormLabel>
                조리도구
                <OptionalMark />
              </FormLabel>
              <span className="text-xs tabular-nums text-muted-foreground">
                {tools.length}/{MAX_RECIPE_TOOLS}
              </span>
            </div>
            <FormControl>
              <Input
                placeholder="예) 프라이팬, 냄비, 에어프라이어"
                ref={field.ref}
                onBlur={field.onBlur}
                name={field.name}
                value={toolsInput}
                onChange={(event) => {
                  const next = event.target.value;
                  setToolsInput(next);
                  field.onChange(normalizeTools(next));
                }}
              />
            </FormControl>
            <FormDescription>
              쉼표(,)로 구분해 적어 주세요. 필요 없으면 비워 두세요.
            </FormDescription>
            <ChipPreview items={tools} />
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
