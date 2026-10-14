"use client";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecipe } from "@/domain/recipe/api";

import { Recipe } from "@/domain/recipe/types";
import Image from "next/image";
import React, { ChangeEvent } from "react";
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { ComboFormValues } from "@/domain/combo/types";
import {
  comboRecipeIdSchema,
  COMBO_ITEM_TEXT_LIMITS,
  MAX_COMBO_ITEMS,
  MIN_COMBO_ITEMS,
} from "@/domain/combo/schema";
import { COMBO_RECIPE_REFERENCE_ERRORS } from "@/domain/combo/messages";
import type { ApiError } from "@/lib/errors/api-client";

type CombinationFieldsProps = {
  itemsArray: UseFieldArrayReturn<ComboFormValues, "items">;
  form: UseFormReturn<ComboFormValues>;
};

export default function CombinationFields({ itemsArray, form }: CombinationFieldsProps) {
  const [tabValue, setTabValue] = React.useState<"product" | "recipe">("product");
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

  return (
    <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4 ">
      <FormField
        control={form.control}
        name="items"
        render={() => (
          <FormItem>
            <div className="flex items-center space-x-4">
              <Tabs defaultValue={tabValue}>
                <TabsList className="gap-5">
                  <TabsTrigger
                    className="cursor-pointer rounded-md"
                    value="product"
                    onClick={() => {
                      setTabValue("product");
                    }}
                  >
                    Product
                  </TabsTrigger>

                  <TabsTrigger
                    className="cursor-pointer rounded-md"
                    value="recipe"
                    onClick={() => {
                      setTabValue("recipe");
                    }}
                  >
                    Recipe
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div> 유형을 선택해주세요</div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={itemsArray.fields.length >= MAX_COMBO_ITEMS}
              onClick={() =>
                itemsArray.append(
                  tabValue === "product"
                    ? { type: "product", productName: "", summary: "", image: null }
                    : { type: "recipe", recipeid: "", summary: "" }
                )
              }
            >
              항목 추가
            </Button>
            <FormDescription>
              레시피와 상품을 합쳐 {MIN_COMBO_ITEMS}개 이상, 최대 {MAX_COMBO_ITEMS}개까지 추가할 수
              있어요.
            </FormDescription>
            {itemsArray.fields.map((item, index) => (
              <div key={item.id} className="mb-2 rounded border  p-2">
                <div>
                  {/* 외부 제품 및 브랜드  */}
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
                          <FormItem className="flex flex-col md:flex-row justify-between w-full pt-4 pb-4 ">
                            <div className="space-y-5">
                              <FormField
                                control={form.control}
                                name={`items.${index}.image`}
                                render={({ field: imageField }) => (
                                  <FormItem>
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
                              <FormControl>
                                <Input
                                  placeholder="제품명"
                                  maxLength={COMBO_ITEM_TEXT_LIMITS.productName}
                                  aria-label={`상품 ${index + 1} 이름`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                              <FormField
                                control={form.control}
                                name={`items.${index}.summary`}
                                render={({ field: summaryField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="요약"
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
                            </div>
                            {/* 미리보기 field */}
                            <div className="space-y-5 rounded-md border border-muted-foreground/30 bg-background p-4 shadow-lg  w-[300px] h-[270px] ">
                              <div className="relative h-[150px] w-[200px] border-[2px] ">
                                {/* 새 파일 미리보기 또는 기존 string URL (update) */}
                                {preview ? (
                                  <Image
                                    className="rounded-md "
                                    src={preview}
                                    alt="previewimg"
                                    fill
                                  ></Image>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                    이미지가 존재하지 않습니다
                                  </div>
                                )}
                              </div>

                              <div className="text-sm text-muted-foreground font-sans-serif w-[260px] h-[20px] overflow-hidden truncate">
                                {productName
                                  ? `${productName}`
                                  : "제품명을 입력하면 미리보기가 나옵니다."}
                              </div>
                              <div className="text-sm text-muted-foreground font-sans-serif font-sans  w-[260px] h-[20px] overflow-hidden truncate">
                                {summary ? `${summary}` : "요약을 입력하면 미리보기가 나옵니다."}
                              </div>
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
                      render={({ field }) => (
                        <FormItem className="flex flex-col md:flex-row justify-between w-full py-5">
                          <div className="space-y-5">
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
                            <FormMessage />
                            <Button
                              type="button"
                              onClick={() => fetchRecipeByid(field.value, index)}
                            >
                              레시피 가져오기
                            </Button>
                          </div>
                          <div className="space-y-5 rounded-md border border-muted-foreground/30 bg-background p-4 shadow-lg w-[300px] h-[250px]">
                            {recipeRef[field.value] ? (
                              <div className="mt-2 space-y-5 ">
                                <Image
                                  className="rounded-lg"
                                  src={recipeRef[field.value]?.image || ""}
                                  alt={recipeRef[field.value]?.title || "recipe image"}
                                  width={170}
                                  height={200}
                                />
                                <div className="text-sm text-muted-foreground font-sans-serif font-sans w-[260px] h-[20px] overflow-hidden truncate">
                                  레시피명: {recipeRef[field.value]?.title}
                                </div>
                                <div className="text-sm text-muted-foreground font-sans-serif font-sans w-[260px] h-[20px] overflow-hidden truncate">
                                  설명: {recipeRef[field.value]?.summary}
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                레시피 정보를 불러와주세요
                              </div>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                  <Button
                    className="rounded-3xl bg-gray-200 hover:bg-[#ff3434] hover:text-stone-100 text-gray-500 border-1"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      itemsArray.remove(index);
                    }}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
