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

const postContentJsonSchema = z.union([z.record(jsonValueSchema), z.array(jsonValueSchema)]);
export const postCategorySchema = z.enum(POST_CATEGORY_VALUES);

export const postInsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(150, "제목은 150자 이하로 입력해 주세요."),
  content_json: postContentJsonSchema,
  category: postCategorySchema,
});

export const postUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(150).optional(),
    content_json: postContentJsonSchema.optional(),
    category: postCategorySchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 항목을 한 가지 이상 입력해 주세요.",
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
