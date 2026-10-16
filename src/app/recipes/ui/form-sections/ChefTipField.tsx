import { FormSection } from "@/components/forms/FormSection";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RECIPE_TEXT_LIMITS } from "@/domain/recipe/schema";
import { type FormValues } from "@/domain/recipe/types";
import { type UseFormReturn, useWatch } from "react-hook-form";

type ChefTipFieldProps = {
  form: UseFormReturn<FormValues>;
};

export function ChefTipField({ form }: ChefTipFieldProps) {
  const chefTip = useWatch({ control: form.control, name: "chef_tip" });
  return (
    <FormSection
      step={6}
      title="셰프의 팁"
      description="조리할 때 알면 좋은 요령이나 맛을 살리는 비법을 적어 주세요."
      aside="선택"
    >
      <FormField
        control={form.control}
        name="chef_tip"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">셰프의 팁</FormLabel>
            <FormControl>
              <Textarea
                placeholder="예) 마늘은 약불에서 먼저 볶아 향을 내면 훨씬 고소해요."
                rows={3}
                maxLength={RECIPE_TEXT_LIMITS.chefTip}
                className="bg-background"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <div className="flex justify-between gap-3">
              <FormMessage />
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {(chefTip ?? "").length}/{RECIPE_TEXT_LIMITS.chefTip}
              </span>
            </div>
          </FormItem>
        )}
      />
    </FormSection>
  );
}
