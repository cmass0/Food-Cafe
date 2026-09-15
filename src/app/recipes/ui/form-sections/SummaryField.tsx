import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { type UseFormReturn } from "react-hook-form";
import { type FormValues } from "@/domain/recipe/types";

type SummaryFieldProps = {
  form: UseFormReturn<FormValues>;
  summaryLength: number;
};

export function SummaryField({ form, summaryLength }: SummaryFieldProps) {
  return (
    <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="text-base">요약/소개</FormLabel>
              <span className="text-xs text-muted-foreground">{summaryLength}/500</span>
            </div>
            <FormControl>
              <Textarea
                placeholder="이 레시피를 한 줄로 소개해 주세요."
                maxLength={500}
                className="bg-background"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
