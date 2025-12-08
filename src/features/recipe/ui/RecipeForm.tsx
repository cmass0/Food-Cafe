"use client";

import { useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StepInput = { text: string };

// 파일 자체를 검증하기 위한 스키마
const imageFileSchema = z
  .union([z.instanceof(File), z.null()], {
    required_error: "대표 이미지를 파일로 선택해 주세요.",
  })
  .superRefine((file, ctx) => {
    if (!file) {
      ctx.addIssue({ code: "custom", message: "대표 이미지를 파일로 선택해 주세요." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      ctx.addIssue({ code: "custom", message: "파일 크기는 5MB 이하만 가능합니다." });
    }
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      ctx.addIssue({ code: "custom", message: "지원하지 않는 파일 형식입니다." });
    }
  });

// 폼 전용 스키마: API 스키마에서 image/id는 빼고, imageFile(File)을 추가
const recipeFormSchema = recipeInsertSchema.omit({ image: true, id: true }).extend({
  imageFile: imageFileSchema,
});

type FormValues = z.infer<typeof recipeFormSchema> & {
  steps: StepInput[];
  summary: string;
  recipe: string;
  category: string;
  tags: string[];
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

  submitLabel = "레시피 등록",
}: RecipeFormProps) {
  const [tagsInput, setTagsInput] = useState((defaultValues?.tags ?? []).join(", "));
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const initialSteps: StepInput[] = defaultValues?.recipe
    ?.split(/\n+/)
    .map((line) => line.replace(/^\d+\)\s*/, "").trim())
    .filter(Boolean)
    .map((text) => ({ text })) ?? [{ text: "" }];

  const defaultValuesForForm: FormValues = {
    title: defaultValues?.title ?? "",
    summary: defaultValues?.summary ?? "",
    recipe: defaultValues?.recipe ?? "",
    category: defaultValues?.category ?? "",
    tags: defaultValues?.tags ?? [],
    steps: initialSteps,
    imageFile: null,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(recipeFormSchema) as unknown as Resolver<FormValues>,
    mode: "onChange",
    defaultValues: defaultValuesForForm,
  });

  const stepsArray = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const summaryLength = (form.watch("summary") ?? "").length;

  const handleSubmit = form.handleSubmit(async (values) => {
    console.log("Submitting form with values:", values.steps, "and imageFile:", values.imageFile);

    if (!values.imageFile) {
      form.setError("imageFile", {
        type: "manual",
        message: "대표 이미지를 파일로 선택해 주세요.",
      });
      return;
    }

    const rawSteps = form.getValues("steps") ?? [];
    const trimmedSteps = rawSteps.map((step) => step.text.trim());
    const hasEmptyStep = trimmedSteps.some((text) => text.length === 0);
    if (hasEmptyStep || trimmedSteps.length === 0) {
      form.setError("steps", {
        type: "manual",
        message: "모든 단계에 내용을 입력해 주세요.",
      });
      return;
    }
    form.clearErrors("steps");

    const recipeFromSteps =
      trimmedSteps.length > 0
        ? trimmedSteps.map((line, index) => `${index + 1}) ${line}`).join("\n")
        : (values.recipe?.trim() ?? "");

    const payload: RecipeInsertInput = {
      title: values.title,
      summary: values.summary?.trim() ? values.summary.trim() : null,
      recipe: recipeFromSteps,
      category: values.category?.trim() ? values.category.trim() : null,
      tags: normalizeTags(tagsInput),
    };
    console.log("Final payload to submit:", payload);
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
            <CardTitle className="text-2xl font-semibold">자랑할 레시피 공유</CardTitle>
            <p className="text-sm text-muted-foreground">
              재료 정보, 대표 이미지, 만드는 법을 단계별로 적어 주세요.
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
                        <Input placeholder="예: 10분 완성 아보카도 토스트" {...field} />
                      </FormControl>
                      <FormDescription>
                        검색이 잘 되도록 핵심 키워드를 포함해 주세요.
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
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="한식">한식</SelectItem>
                              <SelectItem value="중식">중식</SelectItem>
                              <SelectItem value="일식">일식</SelectItem>
                              <SelectItem value="양식">양식</SelectItem>
                              <SelectItem value="분식">분식</SelectItem>
                              <SelectItem value="디저트">디저트</SelectItem>
                              <SelectItem value="기타">기타</SelectItem>
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
                      <FormLabel>태그 (콤마 구분)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 10분완성, 초간편"
                          value={tagsInput}
                          onChange={(event) => {
                            const next = event.target.value;
                            setTagsInput(next);
                            field.onChange(normalizeTags(next));
                          }}
                        />
                      </FormControl>
                      <FormDescription>최대 20개까지 입력할 수 있습니다.</FormDescription>
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
                <span className="text-xs text-muted-foreground">파일 업로드만 사용</span>
              </div>
              <FormField
                control={form.control}
                name="imageFile"
                render={({ field }) => (
                  <div className="space-y-4">
                    <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 bg-background p-4 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative h-32 w-full overflow-hidden rounded-md border bg-muted/30 md:w-40">
                          {imagePreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imagePreview}
                              alt="대표 이미지 미리보기"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                              대표 이미지 미리보기
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              handleFileChange(event);
                              const nextFile = event.target.files?.[0] ?? null;
                              field.onChange(nextFile);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                          <p className="text-xs text-muted-foreground">
                            로컬 이미지를 올리면 미리보기에 표시되고, 서버에서 업로드 후 URL을
                            저장합니다.
                          </p>
                          <FormMessage />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* 만드는 법(단계) */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <FormField
                control={form.control}
                name="steps"
                render={() => (
                  <FormItem>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <FormLabel className="text-base">만드는 법(단계)</FormLabel>
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
                                    placeholder="이 단계에서 해야 할 일을 구체적으로 적어 주세요."
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
                    <FormDescription>최소 1단계 이상 입력해야 합니다.</FormDescription>
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
                      <FormLabel className="text-base">요약/소개</FormLabel>
                      <span className="text-xs text-muted-foreground">{summaryLength}/500</span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="요리를 만든 이유나 포인트를 간단하게 적어 주세요."
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
            {form.formState.isSubmitting ? "저장 중.." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
