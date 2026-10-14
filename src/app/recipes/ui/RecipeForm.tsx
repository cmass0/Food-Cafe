"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { recipeFormSchema } from "@/domain/recipe/schema";
import type { FormValues, IngredientUnit, RecipeInsertDB, RecipeStep } from "@/domain/recipe/types";

import { FormActionBar, type FormMode } from "@/components/forms/FormActionBar";
import { FormStatusAlert } from "@/components/forms/FormStatusAlert";
import { useLockedSubmit } from "@/components/forms/useLockedSubmit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { BasicInfoFields } from "./form-sections/BasicInfoFields";
import { ChefTipField } from "./form-sections/ChefTipField";
import { ImageUploadField } from "./form-sections/ImageUploadField";
import { IngredientsFields } from "./form-sections/IngredientsFields";
import { StepsFields } from "./form-sections/StepsFields";
import { SummaryField } from "./form-sections/SummaryField";
import { useWritingFormBinding } from "@/hooks/writing-assistant/useWritingFormBinding";

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
  mode: FormMode;
  cancelHref: string;
  error?: string | null;
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
  mode,
  cancelHref,
  error,
}: RecipeFormProps) {
  const [tagsInput, setTagsInput] = useState((defaultValues?.tags ?? []).join(", "));
  const [toolsInput, setToolsInput] = useState((defaultValues?.tools ?? []).join(", "));
  // 기존 이미지 URL이 있으면 초기 미리보기로 설정
  const existingImages = defaultValues?.images?.length
    ? defaultValues.images
    : typeof defaultValues?.image === "string"
      ? [defaultValues.image]
      : [];
  const [imageItems, setImageItems] = useState<ImageItem[]>(
    existingImages.map((image) => ({ value: image, preview: image }))
  );
  const previewUrlsRef = useRef(new Set<string>());
  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

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
    servings: defaultValues?.servings ?? 1,
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
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: defaultValuesForForm,
  });

  useWritingFormBinding({
    snapshot: () => {
      const values = form.getValues();
      return {
        formContext: JSON.stringify({
          title: values.title,
          summary: values.summary,
          chef_tip: values.chef_tip,
          category: values.category,
          difficulty: values.difficulty,
          time_minutes: values.time_minutes,
          servings: values.servings,
          ingredients: values.ingredients,
          steps: values.steps,
          tags: normalizeTags(tagsInput),
          tools: normalizeTools(toolsInput),
        }),
        recipeIds: [],
      };
    },
    apply: (response) => {
      if (form.formState.isSubmitting || response.kind !== "recipe" || !response.draft)
        return false;
      // 이미지와 기존 기본값은 유지한다. AI 반영도 미저장 변경으로 취급한다.
      form.reset({ ...form.getValues(), ...response.draft }, { keepDefaultValues: true });
      setTagsInput(response.draft.tags.join(", "));
      setToolsInput(response.draft.tools.join(", "));
      return true;
    },
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
    form.setValue("imageFile", values[0] ?? null, {
      shouldDirty: true,
      shouldValidate: form.formState.submitCount > 0,
    });
    form.setValue("imageFiles", values, {
      shouldDirty: true,
      shouldValidate: form.formState.submitCount > 0,
    });
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
      ...filesToAdd.map((file) => {
        const preview = URL.createObjectURL(file);
        previewUrlsRef.current.add(preview);
        return { value: file, preview };
      }),
    ];

    setImageItems(nextItems);
    syncImageValues(nextItems);
    event.currentTarget.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const target = imageItems[index];
    if (target?.preview.startsWith("blob:")) {
      URL.revokeObjectURL(target.preview);
      previewUrlsRef.current.delete(target.preview);
    }

    const nextItems = imageItems.filter((_, itemIndex) => itemIndex !== index);
    setImageItems(nextItems);
    syncImageValues(nextItems);
  };

  const submit = useLockedSubmit(handleSubmit);
  // 별도 상태로 관리하는 입력도 포함해, 미저장 변경이 있을 때만 취소를 확인한다.
  const dirty =
    form.formState.isDirty ||
    tagsInput !== (defaultValues?.tags ?? []).join(", ") ||
    toolsInput !== (defaultValues?.tools ?? []).join(", ") ||
    imageItems.length !== existingImages.length ||
    imageItems.some((item, index) => item.value !== existingImages[index]);

  return (
    <Form {...form}>
      <form
        onSubmit={submit}
        noValidate
        aria-busy={form.formState.isSubmitting}
        className="space-y-6"
      >
        <fieldset
          disabled={form.formState.isSubmitting}
          inert={form.formState.isSubmitting}
          className="min-w-0"
        >
          <Card className="border border-muted-foreground/10 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold">
                레시피 {mode === "edit" ? "수정" : "작성"}
              </CardTitle>
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
        </fieldset>
        <FormStatusAlert message={showSubmitError ? "입력 내용을 확인해 주세요." : error} />
        <FormActionBar
          mode={mode}
          resourceLabel="레시피"
          pending={form.formState.isSubmitting}
          dirty={dirty}
          cancelHref={cancelHref}
        />
      </form>
    </Form>
  );
}
