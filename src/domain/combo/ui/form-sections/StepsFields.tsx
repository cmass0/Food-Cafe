import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { type UseFieldArrayReturn, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { ComboFormSchema } from "../../schema";

type StepsFieldsProps = {
  form: UseFormReturn<z.input<typeof ComboFormSchema>>;
  stepsArray: UseFieldArrayReturn<z.input<typeof ComboFormSchema>, "steps">;
};

export function ComboStepsFields({ form, stepsArray }: StepsFieldsProps) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <FormField
        control={form.control}
        name="steps"
        render={() => (
          <FormItem>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <FormLabel className="text-base">조리 단계</FormLabel>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{stepsArray.fields.length} / 15단계</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={stepsArray.fields.length >= 15}
                  onClick={() => stepsArray.append({ description: "" })}
                >
                  단계 추가
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {stepsArray.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-md border border-primary/20 bg-background p-3 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span>단계 {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => stepsArray.move(index, index - 1)}
                      >
                        위로
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === stepsArray.fields.length - 1}
                        onClick={() => stepsArray.move(index, index + 1)}
                      >
                        아래로
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={stepsArray.fields.length <= 1}
                        onClick={() => stepsArray.remove(index)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name={`steps.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="이 단계에서 해야 할 일을 구체적으로 적어 주세요."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
            <FormDescription>최소 1단계 이상 입력해야 합니다.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
