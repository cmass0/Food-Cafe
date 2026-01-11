"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { recipeFormSchema } from "../schema";
import type { FormValues, IngredientUnit, RecipeInsertDB, RecipeStep } from "../types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { BasicInfoFields } from "./form-sections/BasicInfoFields";
import { ImageUploadField } from "./form-sections/ImageUploadField";
import { IngredientsFields } from "./form-sections/IngredientsFields";
import { StepsFields } from "./form-sections/StepsFields";
import { SummaryField } from "./form-sections/SummaryField";

type RecipeFormProps = {
  defaultValues?: Partial<RecipeInsertDB>;
  onSubmit: (values: RecipeInsertDB, extras?: { imageFile: File | string | null }) => Promise<void>;
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
  const existingImage = defaultValues?.image;
  const [imagePreview, setImagePreview] = useState<string | null>(
    typeof existingImage === "string" ? existingImage : null
  );

  // 폼 초기값 설정
  const defaultValuesForForm: FormValues = {
    title: defaultValues?.title ?? "",
    summary: defaultValues?.summary ?? "",
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
    imageFile: defaultValues?.image ?? null, // 기존 이미지 URL 또는 null
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(recipeFormSchema),
    mode: "onSubmit",
    defaultValues: defaultValuesForForm,
  });

  const stepsArray = useFieldArray({ control: form.control, name: "steps" });
  const ingredientsArray = useFieldArray({ control: form.control, name: "ingredients" });
  const summaryLength = (form.watch("summary") ?? "").length;

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
    const imageFile = values.imageFile as File | string | null;
    await onSubmit(payload, { imageFile });
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      // 파일 선택 취소 시 기존 이미지로 복원
      const currentImage = form.getValues("imageFile");
      if (typeof currentImage !== "string") {
        form.setValue("imageFile", defaultValues?.image ?? null, { shouldValidate: true });
      }
      setImagePreview(typeof defaultValues?.image === "string" ? defaultValues.image : null);
      return;
    }
    form.clearErrors("imageFile");
    form.setValue("imageFile", file, { shouldValidate: true });
    setImagePreview(URL.createObjectURL(file));
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
              imagePreview={imagePreview}
              handleFileChange={handleFileChange}
            />
            <IngredientsFields form={form} ingredientsArray={ingredientsArray} />
            <StepsFields form={form} stepsArray={stepsArray} />
            <SummaryField form={form} summaryLength={summaryLength} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting} className="px-6">
            {form.formState.isSubmitting ? "저장 중..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
