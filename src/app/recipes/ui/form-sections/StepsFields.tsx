import { FormSection } from "@/components/forms/FormSection";
import { StepList } from "@/components/forms/StepList";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { MAX_RECIPE_STEP_CHARS, MAX_RECIPE_STEPS } from "@/domain/recipe/schema";
import { type FormValues } from "@/domain/recipe/types";
import { type UseFieldArrayReturn, type UseFormReturn } from "react-hook-form";

type StepsFieldsProps = {
  form: UseFormReturn<FormValues>;
  stepsArray: UseFieldArrayReturn<FormValues, "steps">;
};

export function StepsFields({ form, stepsArray }: StepsFieldsProps) {
  return (
    <FormSection
      step={5}
      title="조리 순서"
      description="한 단계에 한 가지 일만 적으면 따라 하기 쉬워요. 불 세기와 시간도 함께 적어 주세요."
      aside={`${stepsArray.fields.length}/${MAX_RECIPE_STEPS}단계`}
    >
      <FormField
        control={form.control}
        name="steps"
        render={() => (
          <FormItem>
            <StepList
              count={stepsArray.fields.length}
              max={MAX_RECIPE_STEPS}
              getKey={(index) => stepsArray.fields[index]?.id ?? String(index)}
              onAdd={() => stepsArray.append({ description: "" })}
              onMove={stepsArray.move}
              onRemove={stepsArray.remove}
              renderStep={(index) => (
                <FormField
                  control={form.control}
                  name={`steps.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="sr-only">{index + 1}단계</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            index === 0
                              ? "예) 양파는 채 썰고, 돼지고기는 한입 크기로 썰어 주세요."
                              : "이 단계에서 할 일을 적어 주세요."
                          }
                          rows={3}
                          maxLength={MAX_RECIPE_STEP_CHARS}
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
