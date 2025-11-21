"use client";

import { useState, type ChangeEvent } from "react";
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

  const form = useForm<RecipeInsertInput>({
    resolver: zodResolver(recipeInsertSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultValues,
      title: defaultValues?.title ?? "",
      summary: defaultValues?.summary ?? "",
      recipe: defaultValues?.recipe ?? "",
      image: defaultValues?.image ?? "",
      tags: defaultValues?.tags ?? [],
      category: defaultValues?.category ?? "",
    },
  });

  const summaryLength = (form.watch("summary") ?? "").length;
  const recipeLength = (form.watch("recipe") ?? "").length;

  const handleSubmit = form.handleSubmit(async (values) => {
    setUploadError(null);
    if (enableImageUpload && requireImageUpload && !imageFile && !values.image?.trim()) {
      setUploadError("대표 이미지를 업로드하거나 URL을 입력해 주세요.");
      return;
    }

    const payload: RecipeInsertInput = {
      ...defaultValues,
      ...values,
      summary: values.summary?.trim() ? values.summary.trim() : null,
      recipe: values.recipe?.trim() ?? "",
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

            <FormField
              control={form.control}
              name="recipe"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>만드는 법</FormLabel>
                    <span className="text-xs text-muted-foreground">{recipeLength}자</span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder={[
                        "1) 재료 준비",
                        "2) 손질/밑간",
                        "3) 조리 순서",
                        "4) 플레이팅 팁",
                      ].join("\n")}
                      rows={8}
                      className="min-h-[220px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>단계별로 번호를 붙이면 읽기 쉬워요.</FormDescription>
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
