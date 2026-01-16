import { z } from "zod";

import type { Json } from "@/types/supabase";

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

export const postInsertSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(150),
  content_json: postContentJsonSchema,
  content_text: z.string().trim().optional(),
  writer_name: z.string().trim().min(1, "작성자를 입력해 주세요.").max(120),
  type: z.string().trim().max(40).optional(),
});

export const postUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(150).optional(),
    content_json: postContentJsonSchema.optional(),
    content_text: z.string().trim().optional(),
    writer_name: z.string().trim().min(1).max(120).optional(),
    type: z.string().trim().max(40).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 항목을 한 가지 이상 입력해 주세요.",
  });

export const postListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  page: z.number().int().min(1).optional(),
  writerUid: z.string().uuid().optional(),
  type: z.string().trim().max(40).optional(),
  search: z.string().trim().max(200).optional(),
  searchField: z.enum(["title", "writer", "contents", "title_contents"]).optional(),
});