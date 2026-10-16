import { FormSection } from "@/components/forms/FormSection";
import { StepList } from "@/components/forms/StepList";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { MAX_COMBO_STEP_CHARS, MAX_COMBO_STEPS } from "@/domain/combo/schema";
import { ComboFormValues } from "@/domain/combo/types";
import { type UseFieldArrayReturn, type UseFormReturn } from "react-hook-form";

type StepsFieldsProps = {
  form: UseFormReturn<ComboFormValues>;
  stepsArray: UseFieldArrayReturn<ComboFormValues, "steps">;
};

export function ComboStepsFields({ form, stepsArray }: StepsFieldsProps) {
  return (
    <FormSection
      step={5}
      title="만드는 순서"
      description="레시피와 상품을 어떤 순서로 준비해 함께 먹는지 적어 주세요."
      aside={`${stepsArray.fields.length}/${MAX_COMBO_STEPS}단계`}
    >
      <FormField
        control={form.control}
        name="steps"
        render={() => (
          <FormItem>
            <StepList
              count={stepsArray.fields.length}
              max={MAX_COMBO_STEPS}
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
                              ? "예) 컵라면에 물을 붓고 기다리는 동안 계란말이를 데워 주세요."
                              : "이 단계에서 할 일을 적어 주세요."
                          }
                          rows={3}
                          maxLength={MAX_COMBO_STEP_CHARS}
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
