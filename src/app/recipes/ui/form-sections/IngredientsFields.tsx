import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type UseFieldArrayReturn, type UseFormReturn } from "react-hook-form";
import { INGREDIENT_TEXT_LIMITS } from "@/domain/recipe/schema";
import { type FormValues } from "@/domain/recipe/types";

type IngredientsFieldsProps = {
  form: UseFormReturn<FormValues>;
  ingredientsArray: UseFieldArrayReturn<FormValues, "ingredients">;
};

export function IngredientsFields({ form, ingredientsArray }: IngredientsFieldsProps) {
  return (
    <div className="rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
      <FormField
        control={form.control}
        name="ingredients"
        render={() => (
          <FormItem>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <FormLabel className="text-base">재료</FormLabel>
                <FormDescription className="text-xs">
                  재료명 · 용량 · 단위를 입력하세요
                </FormDescription>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{ingredientsArray.fields.length}개</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={ingredientsArray.fields.length >= 40}
                  onClick={() =>
                    ingredientsArray.append({
                      name: "",
                      amount: "",
                      unit: "g",
                      unitCustom: "",
                    })
                  }
                >
                  재료 추가
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {ingredientsArray.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-md border border-muted-foreground/20 bg-background p-3 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span>재료 {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={ingredientsArray.fields.length <= 1}
                      onClick={() => ingredientsArray.remove(index)}
                    >
                      삭제
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-xs text-muted-foreground">재료명</FormLabel>
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

                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">용량</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="예) 200"
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
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">단위</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                if (val !== "__custom__") {
                                  form.clearErrors(`ingredients.${index}.unitCustom`);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="단위" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="g">g</SelectItem>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="ml">ml</SelectItem>
                                  <SelectItem value="L">L</SelectItem>
                                  <SelectItem value="컵">컵</SelectItem>
                                  <SelectItem value="큰술">큰술</SelectItem>
                                  <SelectItem value="작은술">작은술</SelectItem>
                                  <SelectItem value="꼬집">꼬집</SelectItem>
                                  <SelectItem value="줌">줌</SelectItem>
                                  <SelectItem value="개">개</SelectItem>
                                  <SelectItem value="마리">마리</SelectItem>
                                  <SelectItem value="custom">직접 입력</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch(`ingredients.${index}.unit`) === "custom" ? (
                    <div className="mt-3">
                      <FormField
                        control={form.control}
                        name={`ingredients.${index}.unitCustom`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">
                              단위 직접 입력
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="예) 한 컵, 한 줌"
                                maxLength={INGREDIENT_TEXT_LIMITS.unitCustom}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
