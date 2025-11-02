import { z } from "zod";

export const postInsertSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(150),
  content: z.string().min(1, "내용을 입력해 주세요."),
  writerName: z.string().trim().min(1, "작성자를 입력해 주세요.").max(120),
  type: z.string().trim().max(40).optional(),
});

export const postUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(150).optional(),
    content: z.string().min(1).optional(),
    writerName: z.string().trim().min(1).max(120).optional(),
    type: z.string().trim().max(40).optional(),
    checkIncrement: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 항목을 한 가지 이상 입력해 주세요.",
  });

export const postListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  page: z.number().int().min(1).optional(),
  offset: z.number().int().min(0).optional(),
  writerUid: z.string().uuid().optional(),
  type: z.string().trim().max(40).optional(),
  search: z.string().trim().max(200).optional(),
});
