"use client";

import { useState, type ChangeEvent } from "react";
import { useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { recipeInsertSchema } from "../schema";
import type { RecipeInsertInput } from "../types";

type StepInput = { text: string };
type FormValues = RecipeInsertInput & { steps: StepInput[] };

type RecipeFormProps = {
  defaultValues?: Partial<RecipeInsertInput>;
  enableImageUpload?: boolean;
  requireImageUpload?: boolean;
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

export default function RecipeForm({
  defaultValues,
  onSubmit,
  enableImageUpload = false,
  requireImageUpload = false,
  submitLabel = "레시피 등록",
}: RecipeFormProps) {
  const [tagsInput, setTagsInput] = useState((defaultValues?.tags ?? []).join(", "));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const initialSteps: StepInput[] = defaultValues?.recipe
    ?.split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({ text })) ?? [{ text: "" }, { text: "" }];

  // React Hook Form 기본값을 스키마 형태로 맞춰 타입 오류를 방지
  const defaultValuesForForm: FormValues = {
    idTextOld: defaultValues?.idTextOld ?? "",
    legacyId: defaultValues?.legacyId ?? null,
    title: defaultValues?.title ?? "",
    summary: defaultValues?.summary ?? "",
    recipe: defaultValues?.recipe ?? "",
    image: defaultValues?.image ?? "",
    images: defaultValues?.images ?? [],
    category: defaultValues?.category ?? null,
    tags: defaultValues?.tags ?? [],
    status: defaultValues?.status ?? null,
    writerUid: defaultValues?.writerUid ?? null,
    writerUidLegacy: defaultValues?.writerUidLegacy ?? null,
    writerName: defaultValues?.writerName ?? null,
    writerEmail: defaultValues?.writerEmail ?? null,
    steps: initialSteps,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(recipeInsertSchema) as unknown as Resolver<FormValues>,
    mode: "onChange",
    defaultValues: defaultValuesForForm,
  });

  const stepsArray = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const summaryLength = (form.watch("summary") ?? "").length;
  const recipeLength = (form.watch("recipe") ?? "").length;

  const handleSubmit = form.handleSubmit(async (values) => {
    setUploadError(null);
    if (enableImageUpload && requireImageUpload && !imageFile && !values.image?.trim()) {
      setUploadError("대표 이미지를 업로드하거나 URL을 입력해 주세요.");
      return;
    }

    const stepLines = (values.steps ?? []).map((step) => step.text.trim()).filter(Boolean);
    const recipeFromSteps =
      stepLines.length > 0
        ? stepLines.map((line, index) => `${index + 1}) ${line}`).join("\n")
        : (values.recipe?.trim() ?? "");

    const payload: RecipeInsertInput = {
      ...defaultValuesForForm,
      ...values,
      summary: values.summary?.trim() ? values.summary.trim() : null,
      recipe: recipeFromSteps,
      image: values.image?.trim() ?? "",
      category: values.category?.trim() ? values.category.trim() : null,
      tags: normalizeTags(tagsInput),
    };

    await onSubmit(payload, { imageFile });
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setUploadError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-muted-foreground/10 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">나만의 레시피 공유</CardTitle>
            <p className="text-sm text-muted-foreground">
              한 줄 소개와 핵심 팁을 남겨두면 다른 사람들에게 더 사랑받아요.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>레시피 제목</FormLabel>
                    <FormControl>
                      <Input placeholder="예) 에어프라이어로 만드는 갈릭버터 새우" {...field} />
                    </FormControl>
                    <FormDescription>
                      검색이 잘 되도록 재료/조리법 키워드를 포함해 주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리 (선택)</FormLabel>
                    <FormControl>
                      <Input placeholder="예) 한식 · 브런치 · 다이어트" {...field} />
                    </FormControl>
                    <FormDescription>요리 분위기나 콘셉트를 한 단어로 남겨주세요.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>태그 (쉼표로 구분)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="예) 10분완성, 캠핑, 초간단"
                        value={tagsInput}
                        onChange={(event) => {
                          const next = event.target.value;
                          setTagsInput(next);
                          field.onChange(normalizeTags(next));
                        }}
                      />
                    </FormControl>
                    <FormDescription>최대 20개까지 입력할 수 있어요.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <div className="md:col-span-2 space-y-4">
                    <FormItem>
                      <FormLabel>대표 이미지 URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>완성 샷을 올리면 클릭률이 올라가요.</FormDescription>
                      <FormMessage />
                    </FormItem>

                    {enableImageUpload ? (
                      <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 p-4 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                          <div className="relative h-32 w-full overflow-hidden rounded-md border bg-muted/30 md:w-40">
                            {imagePreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={imagePreview}
                                alt="이미지 미리보기"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                                이미지 미리보기
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input type="file" accept="image/*" onChange={handleFileChange} />
                            <p className="text-xs text-muted-foreground">
                              이미지 파일을 업로드하거나 위 URL 필드에 직접 링크를 입력할 수 있어요.
                            </p>
                            {uploadError ? (
                              <p className="text-xs font-medium text-destructive">{uploadError}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              />
            </div>

            {/* 단계별 레시피 작성 Form */}
            <div className="border-2 rounded-md p-4">
              <FormField
                control={form.control}
                name="steps"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base">만드는 법 (단계별)</FormLabel>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{stepsArray.fields.length} / 15단계</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={stepsArray.fields.length >= 15}
                          onClick={() => stepsArray.append({ text: "" })}
                        >
                          단계 추가
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {stepsArray.fields.map((field, index) => (
                        <div key={field.id} className="border-muted-foreground/20 p-3">
                          <div className="mb-2 flex items-center justify-between text-sm font-medium text-muted-foreground">
                            <span>{index + 1}단계</span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={index === 0}
                                onClick={() => stepsArray.move(index, index - 1)}
                              >
                                ↑
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={index === stepsArray.fields.length - 1}
                                onClick={() => stepsArray.move(index, index + 1)}
                              >
                                ↓
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => stepsArray.remove(index)}
                              >
                                삭제
                              </Button>
                            </div>
                          </div>
                          <FormField
                            control={form.control}
                            name={`steps.${index}.text`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    placeholder="이 단계에서 해야 할 일을 구체적으로 적어주세요."
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                    <FormDescription>
                      단계에 내용을 입력하면 제출 시 자동으로 한 줄씩 번호를 붙여 만드는 법에
                      반영됩니다.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>한 줄 소개</FormLabel>
                    <span className="text-xs text-muted-foreground">{summaryLength}/500</span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="재료 준비 팁이나 요리의 매력을 짧게 적어주세요."
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
