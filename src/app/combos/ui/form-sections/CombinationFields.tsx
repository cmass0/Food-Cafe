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
import { CheckCircle2, ChefHat, Loader2, ShoppingBag } from "lucide-react";
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
import { parseRecipeReference } from "@/domain/combo/recipe-reference";
import type { ApiError } from "@/lib/errors/api-client";

type CombinationFieldsProps = {
  itemsArray: UseFieldArrayReturn<ComboFormValues, "items">;
  form: UseFormReturn<ComboFormValues>;
};

const ITEM_KINDS = {
  recipe: {
    label: "사이트 레시피",
    description: "FoodCafe에 올라온 레시피를 ID나 주소로 불러와요",
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
  // 불러오는 중인 레시피 ID. 입력칸 아래에 진행 상태를 보여준다.
  const [loadingIds, setLoadingIds] = React.useState<ReadonlySet<string>>(new Set());
  const setLoading = (id: string, loading: boolean) =>
    setLoadingIds((prev) => {
      const next = new Set(prev);
      if (loading) next.add(id);
      else next.delete(id);
      return next;
    });
  // 항목마다 가장 최근에 보낸 조회 번호. 같은 ID를 연달아 불러와도 마지막 요청의 응답만 반영한다.
  const latestLookup = React.useRef(new Map<string, number>());

  // markDirty가 false면 화면을 열 때 저장된 값을 다시 확인하는 경우다. 사용자가 바꾼 게 아니므로 미저장 변경으로 치지 않는다.
  const fetchRecipeByid = async (input: string, index: number, markDirty = true) => {
    const fieldName = `items.${index}.recipeid` as const;
    form.clearErrors(fieldName);
    if (!input.trim()) {
      form.setError(fieldName, { type: "manual", message: COMBO_RECIPE_REFERENCE_ERRORS.required });
      return;
    }
    const parsed = comboRecipeIdSchema.safeParse(parseRecipeReference(input));
    if (!parsed.success) {
      form.setError(fieldName, { type: "manual", message: COMBO_RECIPE_REFERENCE_ERRORS.invalid });
      return;
    }
    const id = parsed.data;
    form.setValue(fieldName, id, { shouldDirty: markDirty });
    // 입력 변경·항목 삭제·다시 불러오기 뒤 도착한 응답이 다른 항목이나 새 결과를 덮어쓰지 않게 한다.
    const lookup = (latestLookup.current.get(fieldName) ?? 0) + 1;
    latestLookup.current.set(fieldName, lookup);
    const current = () =>
      latestLookup.current.get(fieldName) === lookup &&
      form.getValues(`items.${index}.type`) === "recipe" &&
      form.getValues(fieldName) === id;
    // 없는 레시피는 불러온 정보를 지워, 저장 전 확인(제목 없는 레시피 칸 거부)에도 걸리게 한다.
    // 빈 값은 undefined가 아니라 명시한다. undefined면 폼을 다시 채울 때 처음 불러온 값이 되살아난다.
    const markNotFound = () => {
      form.setValue(`items.${index}.title`, "", { shouldDirty: markDirty });
      form.setValue(`items.${index}.summary`, "", { shouldDirty: markDirty });
      form.setValue(`items.${index}.image`, null, { shouldDirty: markDirty });
      form.setError(fieldName, { type: "manual", message: COMBO_RECIPE_REFERENCE_ERRORS.notFound });
    };
    setLoading(id, true);
    try {
      const req = await getRecipe(id);
      if (!current()) return;
      if (!req) {
        markNotFound();
        return;
      }
      form.clearErrors(fieldName);
      form.setValue(`items.${index}.image`, req.image ?? null, {
        shouldDirty: markDirty,
        shouldValidate: form.formState.submitCount > 0,
      });
      form.setValue(`items.${index}.title`, req.title ?? undefined, {
        shouldDirty: markDirty,
        shouldValidate: form.formState.submitCount > 0,
      });
      form.setValue(`items.${index}.summary`, req.summary ?? undefined, {
        shouldDirty: markDirty,
        shouldValidate: form.formState.submitCount > 0,
      });
      setRecipeRef((prev) => ({ ...prev, [id]: req }));
    } catch (error) {
      if (!current()) return;
      // 연결 문제로 확인하지 못한 경우는 저장된 제목을 남긴다. 저장할 때 서버가 다시 확인한다.
      if ((error as ApiError | null)?.status === 404) markNotFound();
      else
        form.setError(fieldName, {
          type: "manual",
          message: COMBO_RECIPE_REFERENCE_ERRORS.unavailable,
        });
    } finally {
      // 같은 칸에 더 최근 요청이 있으면 그 요청이 끝날 때 진행 표시를 지운다.
      if (latestLookup.current.get(fieldName) === lookup) setLoading(id, false);
    }
  };

  // 레시피 칸에 입력할 때. 다른 레시피를 가리키면 불러온 정보를 지우고, 올바른 ID·주소면 바로 불러온다.
  // 한 글자씩 치는 중에는 형식이 맞지 않아 부르지 않는다. 이 화면에서 이미 확인한 같은 레시피의 주소는 다시 조회하지 않고 ID로만 바꾼다.
  const handleRecipeInput = (next: string, previous: string, index: number) => {
    const fieldName = `items.${index}.recipeid` as const;
    const changed = parseRecipeReference(next) !== parseRecipeReference(previous);
    if (changed) {
      form.setValue(`items.${index}.title`, undefined);
      form.setValue(`items.${index}.summary`, undefined);
      form.setValue(`items.${index}.image`, undefined);
    }
    form.clearErrors(fieldName);
    const parsed = comboRecipeIdSchema.safeParse(parseRecipeReference(next));
    if (!parsed.success) return;
    // 저장된 제목이 아니라 이 화면에서 실제로 확인한 레시피인지로 판단한다(열 때 확인이 실패했을 수 있다).
    if (changed || !recipeRef[parsed.data]) void fetchRecipeByid(next, index);
    else if (next !== parsed.data) form.setValue(fieldName, parsed.data, { shouldDirty: true });
  };

  // 수정 화면을 열 때 저장된 레시피 칸을 한 번씩 다시 확인한다. 제목 없이 저장된 예전 칸은 채우고,
  // 저장한 뒤 삭제된 레시피는 저장하기 전에 그 칸에서 알린다.
  const loadSavedRecipes = React.useEffectEvent(() => {
    form.getValues("items").forEach((item, index) => {
      if (item.type === "recipe" && comboRecipeIdSchema.safeParse(item.recipeid).success) {
        void fetchRecipeByid(item.recipeid, index, false);
      }
    });
  });
  React.useEffect(() => loadSavedRecipes(), []);

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
                      const loading = loadingIds.has(field.value);
                      return (
                        <FormItem className="flex flex-col gap-4 md:flex-row md:items-start">
                          <div className="min-w-0 flex-1 space-y-2">
                            <FormLabel>레시피 ID 또는 레시피 주소</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="복사한 레시피 ID나 레시피 주소를 붙여 넣어 주세요"
                                  aria-label={`조합 항목 ${index + 1} 레시피 ID`}
                                  {...field}
                                  onChange={(event) => {
                                    const previous = field.value;
                                    field.onChange(event);
                                    handleRecipeInput(event.target.value, previous, index);
                                  }}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className="shrink-0"
                                disabled={loading}
                                onClick={() => fetchRecipeByid(field.value, index)}
                              >
                                불러오기
                              </Button>
                            </div>
                            <FormDescription>
                              레시피 상세 화면의 &lsquo;레시피 ID 복사&rsquo; 버튼으로 복사한 ID나
                              레시피 페이지 주소를 붙여 넣으면 자동으로 불러와요.
                            </FormDescription>
                            <div aria-live="polite">
                              {loading ? (
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                  레시피를 불러오는 중이에요
                                </p>
                              ) : card && !form.getFieldState(`items.${index}.recipeid`).error ? (
                                <p className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                  &lsquo;{card.title}&rsquo; 레시피를 불러왔어요
                                </p>
                              ) : null}
                            </div>
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
