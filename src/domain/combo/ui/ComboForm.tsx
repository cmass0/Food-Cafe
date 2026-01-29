import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { ComboFormSchema } from "../schema";
import { ComboFormValues, ComboSteps } from "../types";
import { ComboBasicInfoFields } from "./form-sections/BasicInfoFields";
import CombinationFields from "./form-sections/CombinationFields";

import { ComboImageUploadField } from "./form-sections/ImageUploadField";
import { ComboStepsFields } from "./form-sections/StepsFields";
import { ComboSummaryField } from "./form-sections/SummaryFiled";

type ComboFormProps = {
  defaultValues?: Partial<ComboFormValues>;
  onSubmit?: (
    values: ComboFormValues,
    extras?: { imageFile: File | string | null }
  ) => Promise<void>;
  submitLabel?: string;
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
  submitLabel = "레시피 조합",
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
    mode: "onBlur",
    defaultValues: defaultValuesForForm,
  });
  // 조리 단계 필드 배열 훅
  const stepsArray = useFieldArray({ control: form.control, name: "steps" });
  // 요약글 길이
  const summaryLength = (form.watch("summary") ?? "").length;
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

    if (onSubmit) {
      const imageFile = values.image as File | string | null;
      await onSubmit(payload, { imageFile });
    }
  });

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
