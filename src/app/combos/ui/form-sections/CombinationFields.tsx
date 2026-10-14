"use client";
import { FormSection } from "@/components/forms/FormSection";
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
import { getRecipe } from "@/domain/recipe/api";

import { Recipe } from "@/domain/recipe/types";
import { cn } from "@/lib/utils";
import { ChefHat, ShoppingBag } from "lucide-react";
import Image from "next/image";
import React, { ChangeEvent } from "react";
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { ComboFormValues } from "@/domain/combo/types";
import {
  COMBO_ITEM_TEXT_LIMITS,
  comboRecipeIdSchema,
  MAX_COMBO_ITEMS,
  MIN_COMBO_ITEMS,
} from "@/domain/combo/schema";
import { COMBO_RECIPE_REFERENCE_ERRORS } from "@/domain/combo/messages";
import type { ApiError } from "@/lib/errors/api-client";

type CombinationFieldsProps = {
  itemsArray: UseFieldArrayReturn<ComboFormValues, "items">;
  form: UseFormReturn<ComboFormValues>;
};

const ITEM_KINDS = {
  recipe: {
    label: "사이트 레시피",
    description: "FoodCafe에 올라온 레시피를 ID로 불러와요",
    icon: ChefHat,
    badge: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  },
  product: {
    label: "상품",
    description: "컵라면·음료처럼 사서 먹는 것을 직접 적어요",
    icon: ShoppingBag,
    badge: "bg-muted text-muted-foreground",
  },
} as const;

export default function CombinationFields({ itemsArray, form }: CombinationFieldsProps) {
  // 초안을 적용하면 field-array의 임시 id가 바뀐다. 실제 File을 키로 삼아 미리보기를 유지한다.
  const [imgPreview, setImagePreview] = React.useState<Map<File, string>>(new Map());
  const previewUrls = React.useRef(new Set<string>());
  React.useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);
  const [recipeRef, setRecipeRef] = React.useState<Record<string, Recipe>>({});

  const fetchRecipeByid = async (input: string, index: number) => {
    const fieldName = `items.${index}.recipeid` as const;
    form.clearErrors(fieldName);
    if (!input.trim()) {
      form.setError(fieldName, { type: "manual", message: COMBO_RECIPE_REFERENCE_ERRORS.required });
      return;
    }
    const parsed = comboRecipeIdSchema.safeParse(parseComboId(input));
    if (!parsed.success) {
      form.setError(fieldName, { type: "manual", message: COMBO_RECIPE_REFERENCE_ERRORS.invalid });
      return;
    }
    const id = parsed.data;
    form.setValue(fieldName, id, {
      shouldDirty: true,
    });
    // 입력 변경·항목 삭제 뒤 도착한 응답이 다른 항목의 값이나 오류를 덮어쓰지 않게 한다.
    const current = () =>
      form.getValues(`items.${index}.type`) === "recipe" && form.getValues(fieldName) === id;
    try {
      const req = await getRecipe(id);
      if (!current()) return;
      if (!req) {
        form.setError(fieldName, {
          type: "manual",
          message: COMBO_RECIPE_REFERENCE_ERRORS.notFound,
        });
        return;
      }
      form.clearErrors(fieldName);
      form.setValue(`items.${index}.image`, req.image ?? null, {
        shouldDirty: true,
        shouldValidate: form.formState.submitCount > 0,
      });
      form.setValue(`items.${index}.title`, req.title ?? undefined, {
        shouldDirty: true,
        shouldValidate: form.formState.submitCount > 0,
      });
      form.setValue(`items.${index}.summary`, req.summary ?? undefined, {
        shouldDirty: true,
        shouldValidate: form.formState.submitCount > 0,
      });
      setRecipeRef((prev) => ({ ...prev, [id]: req }));
    } catch (error) {
      if (!current()) return;
      form.setError(fieldName, {
        type: "manual",
        message:
          (error as ApiError | null)?.status === 404
            ? COMBO_RECIPE_REFERENCE_ERRORS.notFound
            : COMBO_RECIPE_REFERENCE_ERRORS.unavailable,
      });
    }
  };

  const parseComboId = (input: string) => {
    const path = input.trim().split(/[?#]/)[0] ?? "";
    const parts = path.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (!id) return null;
    return id;
  };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      previewUrls.current.add(url);
      setImagePreview((prev) => new Map(prev).set(file, url));
      form.setValue(`items.${index}.image`, file, {
        shouldDirty: true,
        shouldValidate: form.formState.submitCount > 0,
      });
    }
  };

  // "불러오기"로 가져온 정보가 없으면 폼에 저장된 제목·설명·사진을 보여준다(수정 화면, AI 초안 반영).
  const recipeCard = (index: number, id: string) => {
    const fetched = recipeRef[id];
    if (fetched) return { title: fetched.title, summary: fetched.summary, image: fetched.image };
    const title = form.getValues(`items.${index}.title`);
    if (!title) return null;
    const image = form.getValues(`items.${index}.image`);
    return {
      title,
      summary: form.getValues(`items.${index}.summary`) ?? null,
      image: typeof image === "string" && image ? image : null,
    };
  };

  const full = itemsArray.fields.length >= MAX_COMBO_ITEMS;

  return (
    <FormSection
      step={3}
      title="조합 항목"
      description={`사이트에 올라온 레시피와 사서 먹는 상품을 섞어 ${MIN_COMBO_ITEMS}~${MAX_COMBO_ITEMS}개로 구성해요.`}
      aside={`${itemsArray.fields.length}/${MAX_COMBO_ITEMS}개`}
    >
      <FormField
        control={form.control}
        name="items"
        render={() => (
          <FormItem className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {(["recipe", "product"] as const).map((type) => {
                const kind = ITEM_KINDS[type];
                const Icon = kind.icon;
                return (
                  <Button
                    key={type}
                    type="button"
                    variant="outline"
                    disabled={full}
                    onClick={() =>
                      itemsArray.append(
                        type === "product"
                          ? { type: "product", productName: "", summary: "", image: null }
                          : { type: "recipe", recipeid: "", summary: "" }
                      )
                    }
                    className="h-auto flex-col items-start gap-1 whitespace-normal rounded-xl p-3 text-left"
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Icon className="size-4" aria-hidden="true" />+ {kind.label} 추가
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {kind.description}
                    </span>
                  </Button>
                );
              })}
            </div>
            {full ? (
              <p className="text-xs text-muted-foreground">
                항목은 최대 {MAX_COMBO_ITEMS}개까지 넣을 수 있어요.
              </p>
            ) : null}
            <FormMessage />

            {itemsArray.fields.map((item, index) => (
              <div key={item.id} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-semibold",
                        ITEM_KINDS[item.type].badge
                      )}
                    >
                      {ITEM_KINDS[item.type].label}
                    </span>
                    <span className="text-xs text-muted-foreground">항목 {index + 1}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`항목 ${index + 1} 삭제`}
                    className="h-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      itemsArray.remove(index);
                    }}
                  >
                    삭제
                  </Button>
                </div>

                {item.type === "product" ? (
                  <FormField
                    control={form.control}
                    name={`items.${index}.productName`}
                    render={({ field }) => {
                      // 필드 값 가져오기
                      const productName = form.getValues(`items.${index}.productName`);
                      const summary = form.getValues(`items.${index}.summary`);
                      const itemImage = form.getValues(`items.${index}.image`);
                      const preview =
                        itemImage instanceof File
                          ? imgPreview.get(itemImage)
                          : typeof itemImage === "string"
                            ? itemImage
                            : undefined;
                      return (
                        <FormItem className="flex flex-col gap-4 md:flex-row md:items-start">
                          <div className="min-w-0 flex-1 space-y-4">
                            <div className="space-y-2">
                              <FormLabel>상품 이름</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="예: 신라면 컵"
                                  maxLength={COMBO_ITEM_TEXT_LIMITS.productName}
                                  aria-label={`상품 ${index + 1} 이름`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </div>
                            <FormField
                              control={form.control}
                              name={`items.${index}.summary`}
                              render={({ field: summaryField }) => (
                                <FormItem>
                                  <FormLabel>한 줄 설명</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="예: 국물이 매콤해서 볶음밥과 잘 어울려요"
                                      maxLength={COMBO_ITEM_TEXT_LIMITS.summary}
                                      aria-label={`상품 ${index + 1} 요약`}
                                      {...summaryField}
                                      value={summaryField.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${index}.image`}
                              render={({ field: imageField }) => (
                                <FormItem>
                                  <FormLabel>사진</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      name={imageField.name}
                                      ref={imageField.ref}
                                      onBlur={imageField.onBlur}
                                      aria-label={`상품 ${index + 1} 이미지`}
                                      onChange={(e) => handleFileChange(e, index)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          {/* 미리보기 */}
                          <div className="w-full shrink-0 space-y-2 rounded-lg border bg-background p-3 md:w-56">
                            <p className="text-xs font-medium text-muted-foreground">미리보기</p>
                            {/* 테두리와 이미지 모서리가 어긋나지 않게 바깥 칸에서 둥글게 자른다. */}
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border-2">
                              {/* 새 파일 미리보기 또는 기존 string URL (update) */}
                              {preview ? (
                                <Image
                                  className="object-cover"
                                  src={preview}
                                  alt={productName ? `${productName} 사진` : "상품 사진"}
                                  fill
                                  sizes="224px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                  사진을 올리면 여기에 보여요
                                </div>
                              )}
                            </div>
                            <p className="truncate text-sm font-medium">
                              {productName || "상품 이름"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {summary || "한 줄 설명"}
                            </p>
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                ) : (
                  // 사이트 레시피 참조
                  <FormField
                    control={form.control}
                    name={`items.${index}.recipeid`}
                    render={({ field }) => {
                      const card = recipeCard(index, field.value);
                      return (
                        <FormItem className="flex flex-col gap-4 md:flex-row md:items-start">
                          <div className="min-w-0 flex-1 space-y-2">
                            <FormLabel>레시피 ID</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="레시피 ID 또는 레시피 링크"
                                  aria-label={`조합 항목 ${index + 1} 레시피 ID`}
                                  {...field}
                                  onChange={(event) => {
                                    if (
                                      parseComboId(event.target.value) !== parseComboId(field.value)
                                    ) {
                                      form.setValue(`items.${index}.title`, undefined);
                                      form.setValue(`items.${index}.summary`, undefined);
                                      form.setValue(`items.${index}.image`, undefined);
                                    }
                                    field.onChange(event);
                                    form.clearErrors(`items.${index}.recipeid`);
                                  }}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => fetchRecipeByid(field.value, index)}
                              >
                                불러오기
                              </Button>
                            </div>
                            <FormDescription>
                              레시피 상세 화면의 &lsquo;레시피 ID 복사&rsquo;로 복사한 값을 붙여
                              넣고 불러오기를 눌러 주세요.
                            </FormDescription>
                            <FormMessage />
                          </div>
                          {/* 미리보기 */}
                          <div className="w-full shrink-0 space-y-2 rounded-lg border bg-background p-3 md:w-56">
                            <p className="text-xs font-medium text-muted-foreground">미리보기</p>
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border-2">
                              {card?.image ? (
                                <Image
                                  className="object-cover"
                                  src={card.image}
                                  alt={`${card.title} 사진`}
                                  fill
                                  sizes="224px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                                  {card
                                    ? "사진이 없는 레시피예요"
                                    : "레시피를 불러오면 여기에 보여요"}
                                </div>
                              )}
                            </div>
                            <p className="truncate text-sm font-medium">
                              {card?.title ?? "레시피 이름"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {card?.summary || "레시피 설명"}
                            </p>
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                )}
              </div>
            ))}
          </FormItem>
        )}
      />
    </FormSection>
  );
}
