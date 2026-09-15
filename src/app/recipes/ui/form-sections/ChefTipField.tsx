import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { type UseFormReturn } from "react-hook-form";
import { type FormValues } from "@/domain/recipe/types";

type ChefTipFieldProps = {
  form: UseFormReturn<FormValues>;
  chefTipLength: number;
};

export function ChefTipField({ form, chefTipLength }: ChefTipFieldProps) {
  return (
    <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
      <FormField
        control={form.control}
        name="chef_tip"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="text-base">셰프의 팁</FormLabel>
              <span className="text-xs text-muted-foreground">{chefTipLength}/500</span>
            </div>
            <FormControl>
              <Textarea
                placeholder="조리할 때 알면 좋은 팁이 있다면 적어 주세요."
                maxLength={500}
                className="bg-background"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">선택 입력입니다.</p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
