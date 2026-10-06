import { z } from "zod";

import type { Json } from "@/types/supabase";
import { POST_CATEGORY_VALUES } from "./category";

// 재귀적으로 Json 타입을 검증
const jsonValueSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
);

// 제목·본문 크기 상한. DB 제약 조건(posts_*_length 마이그레이션)과 같은 값이라, 앱을 거치지 않고 써도 같은 선에서 막힌다.
export const POST_TITLE_MAX_CHARS = 150;
export const POST_CONTENT_MAX_CHARS = 200_000;
export const POST_CONTENT_TOO_LARGE_MESSAGE = "본문은 200KB 이하로 작성해 주세요.";

const postContentJsonSchema = z.union([z.record(jsonValueSchema), z.array(jsonValueSchema)]);
// 본문 HTML은 브라우저가 만들어 보낸다. 서버가 저장 전에 정제한다.
const postContentHtmlSchema = z
  .string()
  .max(POST_CONTENT_MAX_CHARS, POST_CONTENT_TOO_LARGE_MESSAGE);
export const postCategorySchema = z.enum(POST_CATEGORY_VALUES);

export const postInsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(POST_TITLE_MAX_CHARS, `제목은 ${POST_TITLE_MAX_CHARS}자 이하로 입력해 주세요.`),
  content_json: postContentJsonSchema,
  content_html: postContentHtmlSchema,
  category: postCategorySchema,
});

export const postUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(POST_TITLE_MAX_CHARS).optional(),
    content_json: postContentJsonSchema.optional(),
    content_html: postContentHtmlSchema.optional(),
    category: postCategorySchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 항목을 한 가지 이상 입력해 주세요.",
  })
  // 본문 JSON(수정용 원본)과 HTML(보여 주기용)은 같은 내용이어야 하므로 함께 바꾼다.
  .refine((value) => (value.content_json === undefined) === (value.content_html === undefined), {
    message: "유효하지 않은 게시글 형식입니다.",
  });

export const postListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  page: z.number().int().min(1).optional(),
  sort: z.enum(["recent", "likes", "views"]).optional(),
  writerUid: z.string().uuid().optional(),
  category: postCategorySchema.optional(),
  search: z.string().trim().max(200).optional(),
  searchField: z.enum(["title", "writer", "contents", "title_contents"]).optional(),
});
