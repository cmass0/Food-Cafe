import { FormSection } from "@/components/forms/FormSection";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INGREDIENT_UNITS } from "@/domain/recipe/ingredient-unit";
import { INGREDIENT_TEXT_LIMITS } from "@/domain/recipe/schema";
import { type FormValues } from "@/domain/recipe/types";
import { Plus, X } from "lucide-react";
import { type UseFieldArrayReturn, type UseFormReturn } from "react-hook-form";

const MAX_INGREDIENT_ROWS = 40;
// 재료명 · 양 · 단위 · 삭제 버튼. 넓은 화면에서는 한 줄, 좁은 화면에서는 두 줄로 놓는다.
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem] gap-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_7.5rem_2.25rem]";

type IngredientsFieldsProps = {
  form: UseFormReturn<FormValues>;
  ingredientsArray: UseFieldArrayReturn<FormValues, "ingredients">;
};

export function IngredientsFields({ form, ingredientsArray }: IngredientsFieldsProps) {
  const count = ingredientsArray.fields.length;
  return (
    <FormSection
      step={4}
      title="재료"
      description="재료 이름과 양, 단위를 적어 주세요. 양이 애매하면 '약간'처럼 적어도 돼요."
      aside={`${count}개`}
    >
      <FormField
        control={form.control}
        name="ingredients"
        render={() => (
          <FormItem className="space-y-3">
            <div
              aria-hidden="true"
              className={`${ROW_GRID} hidden px-1 text-xs font-medium text-muted-foreground sm:grid`}
            >
              <span>재료</span>
              <span>양</span>
              <span>단위</span>
            </div>
            <ul className="space-y-2">
              {ingredientsArray.fields.map((row, index) => (
                <li key={row.id} className="rounded-xl border border-border p-2 sm:border-0 sm:p-0">
                  <div className={ROW_GRID}>
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="col-span-2 space-y-1 sm:col-span-1">
                          <FormLabel className="sr-only">재료 {index + 1} 이름</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="예) 돼지고기 앞다리"
                              maxLength={INGREDIENT_TEXT_LIMITS.name}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`재료 ${index + 1} 삭제`}
                      title="재료 삭제"
                      disabled={count <= 1}
                      className="text-muted-foreground hover:text-destructive sm:order-last"
                      onClick={() => ingredientsArray.remove(index)}
                    >
                      <X className="size-4" />
                    </Button>
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="sr-only">재료 {index + 1} 양</FormLabel>
                          <FormControl>
                            <Input
                              inputMode="decimal"
                              placeholder="예) 200"
                              maxLength={INGREDIENT_TEXT_LIMITS.amount}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.unit`}
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="sr-only">재료 {index + 1} 단위</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              if (val !== "custom") {
                                form.clearErrors(`ingredients.${index}.unitCustom`);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                                <SelectValue placeholder="단위" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                {INGREDIENT_UNITS.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit === "custom" ? "직접 입력" : unit}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch(`ingredients.${index}.unit`) === "custom" ? (
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.unitCustom`}
                      render={({ field }) => (
                        <FormItem className="mt-2 space-y-1">
                          <FormLabel className="text-xs text-muted-foreground">
                            단위 직접 입력
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="예) 공기, 봉지, 한 줌"
                              maxLength={INGREDIENT_TEXT_LIMITS.unitCustom}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              disabled={count >= MAX_INGREDIENT_ROWS}
              className="w-full gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
              onClick={() =>
                ingredientsArray.append({ name: "", amount: "", unit: "g", unitCustom: "" })
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              재료 추가
            </Button>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
