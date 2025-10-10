"use client";

import { useState, useTransition, type FormEvent } from "react";
import { recipeInsertSchema } from "../schema";
import type { RecipeInsertInput } from "../types";

type RecipeFormProps = {
  defaultValues?: Partial<RecipeInsertInput>;
  onSubmit: (values: RecipeInsertInput) => Promise<void> | void;
  submitLabel?: string;
};

export default function RecipeForm({defaultValues, onSubmit, submitLabel = "저장",}: RecipeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [summary, setSummary] = useState(defaultValues?.summary ?? "");
  const [body, setBody] = useState(defaultValues?.recipe ?? "");
  const [image, setImage] = useState(defaultValues?.image ?? "");
  const [tagsText, setTagsText] = useState((defaultValues?.tags ?? []).join(", "));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const payload: RecipeInsertInput = {
      ...defaultValues,
      title,
      summary: summary.length ? summary : null,
      recipe: body,
      image: image,
      tags,
      images: defaultValues?.images,
      category: defaultValues?.category,
      writerUid: defaultValues?.writerUid,
      writerUidLegacy: defaultValues?.writerUidLegacy,
      writerName: defaultValues?.writerName,
      writerEmail: defaultValues?.writerEmail,
      status: defaultValues?.status,
      legacyId: defaultValues?.legacyId,
      idTextOld: defaultValues?.idTextOld,
    };

    const validationResult = recipeInsertSchema.safeParse(payload);
    if (!validationResult.success) {
      setError(validationResult.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await onSubmit(validationResult.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">제목</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded border border-divider px-3 py-2"
          placeholder="레시피 제목"
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">요약</span>
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className="min-h-[80px] rounded border border-divider px-3 py-2"
          placeholder="간단한 소개"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">본문</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="min-h-[160px] rounded border border-divider px-3 py-2"
          placeholder="레시피 내용을 입력해 주세요"
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">대표 이미지 URL</span>
        <input
          value={image}
          onChange={(event) => setImage(event.target.value)}
          className="rounded border border-divider px-3 py-2"
          placeholder="https://example.com/image.jpg"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">태그 (쉼표 구분)</span>
        <input
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          className="rounded border border-divider px-3 py-2"
          placeholder="한식, 매콤"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 font-medium text-primary-foreground"
        disabled={isPending}
      >
        {isPending ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
