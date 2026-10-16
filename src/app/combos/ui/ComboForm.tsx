"use client";

import { FormActionBar, type FormMode } from "@/components/forms/FormActionBar";
import { FormStatusAlert } from "@/components/forms/FormStatusAlert";
import { useLockedSubmit } from "@/components/forms/useLockedSubmit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ComboFormSchema } from "@/domain/combo/schema";
import { ComboFormValues, ComboSteps } from "@/domain/combo/types";
import { ComboBasicInfoFields } from "./form-sections/BasicInfoFields";
import CombinationFields from "./form-sections/CombinationFields";

import { ComboImageUploadField } from "./form-sections/ImageUploadField";
import { ComboStepsFields } from "./form-sections/StepsFields";
import { ComboSummaryField } from "./form-sections/SummaryFiled";
import { useWritingFormBinding } from "@/hooks/writing-assistant/useWritingFormBinding";
import { mergeComboDraftItems } from "@/features/writing-assistant/combo-draft";
import { writingRecipeIdSchema } from "@/features/writing-assistant/schema";

type ComboFormProps = {
  defaultValues?: Partial<ComboFormValues>;
  onSubmit: (
    values: ComboFormValues,
    extras?: { imageFile: File | string | null }
  ) => Promise<void>;
  mode: FormMode;
  cancelHref: string;
  error?: string | null;
};

// 태그 문자열을 배열로 변환하고 공백 제거
const normalizeTags = (text: string) =>
  text
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

// 조리 도구 문자열을 배열로 변환하고 공백 제거
const normalizeTools = (text: string) =>
  text
    .split(",")
    .map((tool) => tool.trim())
    .filter((tool) => tool.length > 0);

const buildRecipeListItem = (steps: ComboSteps[]) => {
  const stepList = steps
    .map((step) => ({
      description: step.description.trim(),
    }))
    .filter((step) => step.description.length > 0);

  return stepList;
};

export default function ComboForm({
  defaultValues,
  onSubmit,
  mode,
  cancelHref,
  error,
}: ComboFormProps) {
  const [tagsInput, setTagsInput] = useState((defaultValues?.tags ?? []).join(", "));
  const [toolsInput, setToolsInput] = useState((defaultValues?.tools ?? []).join(", "));

  const defaultValuesForForm = {
    title: defaultValues?.title ?? "",
    summary: defaultValues?.summary ?? "",
    difficulty: defaultValues?.difficulty ?? "",
    time_minutes: defaultValues?.time_minutes ?? 0,
    tags: defaultValues?.tags ?? [],
    tools: defaultValues?.tools ?? [],
    items: defaultValues?.items ?? [],
    steps: defaultValues?.steps ?? [{ description: "" }],
    image: defaultValues?.image ?? null,
  };
  const form = useForm<ComboFormValues>({
    resolver: zodResolver(ComboFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: defaultValuesForForm,
  });

  useWritingFormBinding({
    snapshot: () => {
      const values = form.getValues();
      // 레시피는 ID만 보낸다. 제목·내용은 서버가 DB에서 다시 읽는다.
      const products = values.items.flatMap((item) =>
        item.type === "product" ? [{ productName: item.productName, summary: item.summary }] : []
      );
      const recipeIds = values.items.flatMap((item) =>
        item.type === "recipe" && writingRecipeIdSchema.safeParse(item.recipeid).success
          ? [item.recipeid]
          : []
      );
      return {
        formContext: JSON.stringify({
          title: values.title,
          summary: values.summary,
          difficulty: values.difficulty,
          time_minutes: values.time_minutes,
          steps: values.steps,
          products,
          tags: normalizeTags(tagsInput),
          tools: normalizeTools(toolsInput),
        }),
        recipeIds: [...new Set(recipeIds)],
      };
    },
    apply: (response) => {
      if (form.formState.isSubmitting || response.kind !== "combo" || !response.draft) return false;
      const current = form.getValues();
      const { items } = mergeComboDraftItems(current.items, response.draft.items);
      form.reset({ ...current, ...response.draft, items }, { keepDefaultValues: true });
      setTagsInput(response.draft.tags.join(", "));
      setToolsInput(response.draft.tools.join(", "));
      return true;
    },
    changesOnApply: (response) => {
      if (response.kind !== "combo" || !response.draft) return { restored: [] };
      const { restored } = mergeComboDraftItems(form.getValues().items, response.draft.items);
      return { restored };
    },
  });
  // 조리 단계 필드 배열 훅
  const stepsArray = useFieldArray({ control: form.control, name: "steps" });
  // 요약글 길이
  const summary = useWatch({ control: form.control, name: "summary" });
  const image = useWatch({ control: form.control, name: "image" });
  const items = useWatch({ control: form.control, name: "items" });
  const summaryLength = (summary ?? "").length;
  //
  const itemsArray = useFieldArray({ control: form.control, name: "items" });
  const showSubmitError =
    form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0;

  // 폼 제출 처리
  const handleSubmit = form.handleSubmit(async (values) => {
    const tags = normalizeTags(tagsInput);
    const tools = normalizeTools(toolsInput);

    const payload: ComboFormValues = {
      ...values,
      summary: values.summary ?? undefined,
      difficulty: values.difficulty ?? undefined,
      time_minutes: values.time_minutes ?? undefined,
      tags,
      tools,
      tools_required: tools.length > 0 ? true : false,
      items: values.items,
      steps: buildRecipeListItem(values.steps),
    };

    const imageFile = values.image as File | string | null;
    await onSubmit(payload, { imageFile });
  });

  const submit = useLockedSubmit(handleSubmit);
  // 별도 상태로 관리하는 입력도 포함해, 미저장 변경이 있을 때만 취소를 확인한다.
  const dirty =
    form.formState.isDirty ||
    tagsInput !== (defaultValues?.tags ?? []).join(", ") ||
    toolsInput !== (defaultValues?.tools ?? []).join(", ") ||
    image !== (defaultValues?.image ?? null) ||
    items.some((item) => item.image instanceof File);

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
                조합 {mode === "edit" ? "수정" : "작성"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                레시피와 상품, 이미지, 조리 단계를 차례로 입력해 주세요.
              </p>
            </CardHeader>

            <CardContent className="space-y-8">
              <ComboBasicInfoFields
                form={form}
                tagsInput={tagsInput}
                setTagsInput={setTagsInput}
                normalizeTags={normalizeTags}
                toolsInput={toolsInput}
                setToolsInput={setToolsInput}
                normalizeTools={normalizeTools}
              />
              <ComboImageUploadField form={form} />
              <CombinationFields form={form} itemsArray={itemsArray} />
              <ComboStepsFields form={form} stepsArray={stepsArray} />
              <ComboSummaryField form={form} summaryLength={summaryLength} />
            </CardContent>
          </Card>
        </fieldset>
        <FormStatusAlert message={showSubmitError ? "입력 내용을 확인해 주세요." : error} />
        <FormActionBar
          mode={mode}
          resourceLabel="조합"
          pending={form.formState.isSubmitting}
          dirty={dirty}
          cancelHref={cancelHref}
        />
      </form>
    </Form>
  );
}
