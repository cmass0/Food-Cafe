"use client";

import { useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { recipeFormSchema } from "../schema";
import type {
  FormValues,
  IngredientInput,
  IngredientUnit,
  RecipeInsertInput,
  StepInput,
} from "../types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  BasicInfoFields,
  ImageUploadField,
  IngredientsFields,
  StepsFields,
  SummaryField,
} from "./form-sections";

type RecipeFormProps = {
  defaultValues?: Partial<RecipeInsertInput>;
  onSubmit: (
    values: RecipeInsertInput,
    extras?: { imageFile: File | null }
  ) => Promise<void> | void;
  submitLabel?: string;
};

const normalizeTags = (text: string) =>
  text
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildIngredientListItem = (ingredients: IngredientInput[]) => {
  const safeIngredients = ingredients
    .map((item) => ({
      name: item.name.trim(),
      amount: item.amount.trim(),
      unit: item.unit,
      unitCustom: item.unitCustom.trim(),
    }))
    .filter((item) => item.name.length > 0);

  return safeIngredients;
};

const buildRecipeHtml = (steps: string[]) => {
  const safeSteps = steps.map((step) => step.trim()).filter((step) => step.length > 0);
  const stepList =
    safeSteps.length > 0
      ? `<section data-block="steps"><h2>조리 단계</h2><ol>${safeSteps
          .map((step) => `<li>${escapeHtml(step)}</li>`)
          .join("")}</ol></section>`
      : "";

  return `${stepList ? "\n" : ""}${stepList}`;
};

const parseRecipeHtml = (value: string | null | undefined) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;

  try {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const ingredientItems = Array.from(
      doc.querySelectorAll('section[data-block="ingredients"] li')
    );
    const stepItems = Array.from(doc.querySelectorAll('section[data-block="steps"] ol li'));

    const ingredients: IngredientInput[] = ingredientItems.map((node) => {
      const el = node as HTMLElement;
      const unit = (el.dataset.unit as IngredientUnit | undefined) ?? "g";
      return {
        name: el.dataset.name ?? el.textContent?.trim() ?? "",
        amount: el.dataset.amount ?? "",
        unit: unit === "__custom__" ? "__custom__" : unit,
        unitCustom: el.dataset.unitCustom ?? "",
      };
    });

    const steps: StepInput[] = stepItems
      .map((node) => node.textContent?.trim() ?? "")
      .filter(Boolean)
      .map((step) => ({ text: step }));

    if (ingredients.length === 0 && steps.length === 0) return null;
    return { ingredients, steps };
  } catch {
    return null;
  }
};

export default function RecipeForm({
  defaultValues,
  onSubmit,
  submitLabel = "레시피 등록",
}: RecipeFormProps) {
  const [tagsInput, setTagsInput] = useState((defaultValues?.tags ?? []).join(", "));
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const parsedRecipe = parseRecipeHtml(defaultValues?.recipe);

  const initialSteps: StepInput[] =
    parsedRecipe?.steps && parsedRecipe.steps.length > 0
      ? parsedRecipe.steps
      : (defaultValues?.recipe
          ?.split(/\n+/)
          .map((line) => line.replace(/^\d+\)\s*/, "").trim())
          .filter(Boolean)
          .map((text) => ({ text })) ?? [{ text: "" }]);

  const initialIngredients: IngredientInput[] =
    parsedRecipe?.ingredients && parsedRecipe.ingredients.length > 0
      ? parsedRecipe.ingredients
      : [{ name: "", amount: "", unit: "g", unitCustom: "" }];

  const defaultValuesForForm: FormValues = {
    title: defaultValues?.title ?? "",
    summary: defaultValues?.summary ?? "",
    recipe: defaultValues?.recipe ?? "",
    category: defaultValues?.category ?? "",
    tags: defaultValues?.tags ?? [],
    difficulty: defaultValues?.difficulty ?? null,
    time_minutes: (defaultValues as any)?.time_minutes ?? (defaultValues as any)?.timeMinutes ?? null,
    servings: (defaultValues as any)?.servings ?? null,
    ingredients: initialIngredients,
    steps: initialSteps,
    imageFile: null,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(recipeFormSchema) as unknown as Resolver<FormValues>,
    mode: "onChange",
    defaultValues: defaultValuesForForm,
  });

  const stepsArray = useFieldArray({ control: form.control, name: "steps" });
  const ingredientsArray = useFieldArray({ control: form.control, name: "ingredients" });
  const summaryLength = (form.watch("summary") ?? "").length;

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!values.imageFile) {
      form.setError("imageFile", { type: "manual", message: "대표 이미지를 하나 선택해 주세요." });
      return;
    }

    const rawSteps = form.getValues("steps") ?? [];
    const trimmedSteps = rawSteps.map((step) => step.text.trim());
    const hasEmptyStep = trimmedSteps.some((text) => text.length === 0);
    if (hasEmptyStep || trimmedSteps.length === 0) {
      form.setError("steps", { type: "manual", message: "모든 단계에 내용을 입력해 주세요." });
      return;
    }
    form.clearErrors("steps");

    const rawIngredients = form.getValues("ingredients") ?? [];
    const normalizedIngredients = rawIngredients.map((item) => ({
      name: item.name.trim(),
      amount: item.amount.trim(),
      unit: item.unit as IngredientUnit,
      unitCustom: item.unitCustom.trim(),
    }));

    form.clearErrors("ingredients");
    let hasIngredientError = false;
    normalizedIngredients.forEach((item, index) => {
      const hasAnyValue =
        item.name.length > 0 ||
        item.amount.length > 0 ||
        (item.unit === "__custom__" ? item.unitCustom.length > 0 : item.unit.length > 0);

      if (!hasAnyValue) return;
      if (!item.name) {
        hasIngredientError = true;
        form.setError(`ingredients.${index}.name` as any, {
          type: "manual",
          message: "재료명을 입력해 주세요.",
        });
      }
      if (item.unit === "__custom__" && !item.unitCustom) {
        hasIngredientError = true;
        form.setError(`ingredients.${index}.unitCustom` as any, {
          type: "manual",
          message: "단위를 직접 입력해 주세요.",
        });
      }
    });
    if (hasIngredientError) return;

    const recipeHtml = buildRecipeHtml(trimmedSteps);
    const ingredientList = buildIngredientListItem(normalizedIngredients);

    const payload: RecipeInsertInput = {
      title: values.title,
      summary: values.summary?.trim() ? values.summary.trim() : null,
      recipe: recipeHtml,
      category: values.category?.trim() ? values.category.trim() : null,
      tags: normalizeTags(tagsInput),
      ingredients: ingredientList,
      difficulty: values.difficulty ?? null,
      time_minutes: values.time_minutes ?? null,
      servings: values.servings ?? null,
    };
    await onSubmit(payload, { imageFile: values.imageFile });
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      form.setValue("imageFile", null, { shouldValidate: true });
      setImagePreview(null);
      return;
    }
    form.clearErrors("imageFile");
    form.setValue("imageFile", file, { shouldValidate: true });
    const reader = new FileReader();
    reader.onload = () => setImagePreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
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
