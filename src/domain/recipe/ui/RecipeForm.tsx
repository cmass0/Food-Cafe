"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ChangeEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { recipeFormSchema } from "../schema";
import type { FormValues, IngredientUnit, RecipeInsertDB, RecipeStep } from "../types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { BasicInfoFields } from "./form-sections/BasicInfoFields";
import { ChefTipField } from "./form-sections/ChefTipField";
import { ImageUploadField } from "./form-sections/ImageUploadField";
import { IngredientsFields } from "./form-sections/IngredientsFields";
import { StepsFields } from "./form-sections/StepsFields";
import { SummaryField } from "./form-sections/SummaryField";

type ImageItem = {
  value: File | string;
  preview: string;
};

type RecipeFormProps = {
  defaultValues?: Partial<RecipeInsertDB>;
  onSubmit: (
    values: RecipeInsertDB,
    extras?: { imageFiles: Array<File | string> }
  ) => Promise<void>;
  submitLabel?: string;
};

// 태그 문자열을 배열로 변환하고 공백 제거
const normalizeTags = (text: string) => {
  const tags = text
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  return tags;
};

// 조리 도구 문자열을 배열로 변환하고 공백 제거
const normalizeTools = (text: string) => {
  const tools = text
    .split(",")
    .map((tool) => tool.trim())
    .filter((tool) => tool.length > 0);
  return tools;
};
// 조리단계 목록 생성
const buildRecipeListItem = (steps: RecipeStep[]) => {
  const stepList = steps
    .map((step) => ({
      description: step.description.trim(),
    }))
    .filter((step) => step.description.length > 0);

  return stepList;
};

// 레시피 폼 컴포넌트
export default function RecipeForm({
  defaultValues,
  onSubmit,
  submitLabel = "레시피 등록",
}: RecipeFormProps) {
  const [tagsInput, setTagsInput] = useState((defaultValues?.tags ?? []).join(", "));
  const [toolsInput, setToolsInput] = useState((defaultValues?.tools ?? []).join(", "));
  // 기존 이미지 URL이 있으면 초기 미리보기로 설정
  const existingImages =
    defaultValues?.images?.length
      ? defaultValues.images
      : typeof defaultValues?.image === "string"
        ? [defaultValues.image]
        : [];
  const [imageItems, setImageItems] = useState<ImageItem[]>(
    existingImages.map((image) => ({ value: image, preview: image }))
  );

  // 폼 초기값 설정
  const defaultValuesForForm: FormValues = {
    title: defaultValues?.title ?? "",
    summary: defaultValues?.summary ?? "",
    chef_tip: defaultValues?.chef_tip ?? "",
    category: defaultValues?.category ?? "",
    tags: defaultValues?.tags ?? [],
    tools: defaultValues?.tools ?? [],
    difficulty: defaultValues?.difficulty ?? "",
    time_minutes: defaultValues?.time_minutes ?? 0,
    servings: (defaultValues as any)?.servings ?? null,
    ingredients: defaultValues?.ingredients ?? [
      { name: "", amount: "", unit: "g", unitCustom: "" },
    ],
    steps: defaultValues?.steps ?? [{ description: "" }],
    imageFile: existingImages[0] ?? null, // 기존 대표 이미지 URL 또는 null
    imageFiles: existingImages,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(recipeFormSchema),
    mode: "onSubmit",
    defaultValues: defaultValuesForForm,
  });

  const stepsArray = useFieldArray({ control: form.control, name: "steps" });
  const ingredientsArray = useFieldArray({ control: form.control, name: "ingredients" });
  const summaryValue = useWatch({ control: form.control, name: "summary" });
  const chefTipValue = useWatch({ control: form.control, name: "chef_tip" });
  const summaryLength = (summaryValue ?? "").length;
  const chefTipLength = (chefTipValue ?? "").length;
  const showSubmitError =
    form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0;

  const syncImageValues = (items: ImageItem[]) => {
    const values = items.map((item) => item.value);
    form.setValue("imageFile", values[0] ?? null, { shouldValidate: true });
    form.setValue("imageFiles", values, { shouldValidate: true });
  };

  // 폼 제출 처리
  const handleSubmit = form.handleSubmit(async (values) => {
    // 커스팀 타입 보정
    const normalizedIngredients = values.ingredients
      .map((item) => ({
        name: item.name.trim(),
        amount: item.amount.trim(),
        unit: item.unit as IngredientUnit,
        unitCustom: item.unitCustom?.trim() ?? "",
      }))
      .filter((item) => item.name.length > 0);

    const tools = normalizeTools(toolsInput);
    const tags = normalizeTags(tagsInput);

    // onSubmit 제출 payload
    const payload: RecipeInsertDB = {
      title: values.title,
      summary: values.summary?.trim() ? values.summary.trim() : null,
      chef_tip: values.chef_tip?.trim() ? values.chef_tip.trim() : null,
      steps: buildRecipeListItem(values.steps),
      category: values.category?.trim() ? values.category.trim() : "",
      tags: tags,
      tools: tools,
      tools_required: tools.length > 0,
      ingredients: normalizedIngredients,
      difficulty: values.difficulty,
      time_minutes: values.time_minutes,
      servings: values.servings,
    };
    const imageFiles = (values.imageFiles ?? []) as Array<File | string>;
    await onSubmit(payload, { imageFiles });
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    form.clearErrors("imageFile");
    const availableSlots = Math.max(10 - imageItems.length, 0);
    const filesToAdd = files.slice(0, availableSlots);
    if (filesToAdd.length === 0) {
      event.currentTarget.value = "";
      return;
    }

    const nextItems = [
      ...imageItems,
      ...filesToAdd.map((file) => ({ value: file, preview: URL.createObjectURL(file) })),
    ];

    setImageItems(nextItems);
    syncImageValues(nextItems);
    event.currentTarget.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const target = imageItems[index];
    if (target?.preview.startsWith("blob:")) {
      URL.revokeObjectURL(target.preview);
    }

    const nextItems = imageItems.filter((_, itemIndex) => itemIndex !== index);
    setImageItems(nextItems);
    syncImageValues(nextItems);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-muted-foreground/10 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">레시피 작성</CardTitle>
            <p className="text-sm text-muted-foreground">
              재료와 이미지, 조리 단계를 차례로 입력해 주세요.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            <BasicInfoFields
              form={form}
              tagsInput={tagsInput}
              setTagsInput={setTagsInput}
              normalizeTags={normalizeTags}
              toolsInput={toolsInput}
              setToolsInput={setToolsInput}
              normalizeTools={normalizeTools}
            />
            <ImageUploadField
              form={form}
              imagePreviews={imageItems.map((item) => item.preview)}
              handleFileChange={handleFileChange}
              handleRemoveImage={handleRemoveImage}
            />
            <IngredientsFields form={form} ingredientsArray={ingredientsArray} />
            <StepsFields form={form} stepsArray={stepsArray} />
            <SummaryField form={form} summaryLength={summaryLength} />
            <ChefTipField form={form} chefTipLength={chefTipLength} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          {showSubmitError ? (
            <p className="text-sm text-destructive" role="alert">
              입력을 완료해 주세요.
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="ml-auto px-6"
          >
            {form.formState.isSubmitting ? "저장 중..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
