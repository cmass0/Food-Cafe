"use client";

import { useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StepInput = { text: string };

// RHF에서 사용하는 값은 모두 문자열로 맞추고, 제출 시 DB가 기대하는 null로 변환합니다.
type FormValues = RecipeInsertInput & {
  steps: StepInput[];
  summary: string;
  recipe: string;
  image: string;
  category: string;
  writerName: string;
  writerEmail: string;
};

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
    .map((text) => ({ text })) ?? [{ text: "" }];

  const defaultValuesForForm: FormValues = {
    idTextOld: defaultValues?.idTextOld ?? "",
    legacyId: defaultValues?.legacyId ?? null,
    title: defaultValues?.title ?? "",
    summary: defaultValues?.summary ?? "",
    recipe: defaultValues?.recipe ?? "",
    image: defaultValues?.image ?? "",
    images: defaultValues?.images ?? [],
    category: defaultValues?.category ?? "",
    tags: defaultValues?.tags ?? [],
    status: defaultValues?.status ?? null,
    writerUid: defaultValues?.writerUid ?? null,
    writerUidLegacy: defaultValues?.writerUidLegacy ?? null,
    writerName: defaultValues?.writerName ?? "",
    writerEmail: defaultValues?.writerEmail ?? "",
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
    if (enableImageUpload && requireImageUpload && !imageFile) {
      setUploadError("대표 이미지 파일을 업로드해 주세요.");
      return;
    }

    const stepLines = (values.steps ?? []).map((step) => step.text.trim()).filter(Boolean);
    if (stepLines.length === 0) {
      form.setError("steps", { type: "manual", message: "최소 1개 이상의 단계를 입력해 주세요." });
      return;
    }
    form.clearErrors("steps");

    const recipeFromSteps =
      stepLines.length > 0
        ? stepLines.map((line, index) => `${index + 1}) ${line}`).join("\n")
        : (values.recipe?.trim() ?? "");

    const payload: RecipeInsertInput = {
      ...defaultValuesForForm,
      ...values,
      summary: values.summary?.trim() ? values.summary.trim() : null,
      recipe: recipeFromSteps,
      image: null, // 파일 업로드로만 처리하므로 URL은 비움
      category: values.category?.trim() ? values.category.trim() : null,
      tags: normalizeTags(tagsInput),
      writerName: values.writerName?.trim() || null,
      writerEmail: values.writerEmail?.trim() || null,
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
              레시피 기본 정보 → 대표 이미지 → 단계별 작성 순서로 차근차근 입력해 주세요.
            </p>
          </CardHeader>

          <CardContent className="space-y-8 ">
            {/* 기본 정보 */}
            <div className="space-y-4 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">기본 정보</h3>
                <span className="text-xs text-muted-foreground">제목 · 카테고리 · 태그</span>
              </div>
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
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(val) => field.onChange(val)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="한식">한식</SelectItem>
                              <SelectItem value="일식">일식</SelectItem>
                              <SelectItem value="양식">양식</SelectItem>
                              <SelectItem value="중식">중식</SelectItem>
                              <SelectItem value="아시안">아시안</SelectItem>
                              <SelectItem value="디저트">디저트</SelectItem>
                              <SelectItem value="분식">분식</SelectItem>
                              <SelectItem value="다이어트">다이어트</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
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
              </div>
            </div>

            {/* 대표 이미지 */}
            <div className="space-y-4 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">대표 이미지</h3>
                <span className="text-xs text-muted-foreground">URL 입력 또는 파일 업로드</span>
              </div>
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <div className="space-y-4">
                    {enableImageUpload ? (
                      <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 bg-background p-4 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
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

            {/* 단계별 작성 */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
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
                        <div
                          key={field.id}
                          className="rounded-md border border-primary/20 bg-background p-3 shadow-sm"
                        >
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
                                disabled={stepsArray.fields.length <= 1}
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
                      단계에 내용을 입력하면 제출 시 자동으로 번호를 붙여 만드는 법에 반영됩니다.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 요약/소개 */}
            <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base">한 줄 소개</FormLabel>
                      <span className="text-xs text-muted-foreground">{summaryLength}/500</span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="재료 준비 팁이나 요리의 매력을 짧게 적어주세요."
                        maxLength={500}
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
