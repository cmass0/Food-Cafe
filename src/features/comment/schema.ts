import { z } from "zod";
import { Constants } from "@/types/supabase";

const parentTypeEnum = z.enum(
  [...Constants.public.Enums.comment_parent_type] as ["recipe", "post"]
);

export const commentBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "내용을 입력해주세요.")
    .max(1000, "내용은 최대 1000자입니다."),
});

export const commentContextSchema = z.object({
  parentType: parentTypeEnum,
  parentId: z.string().uuid({ message: "parentId는 UUID 형식이어야 합니다." }),
  writerUid: z.string().uuid({ message: "writerUid는 UUID 형식이어야 합니다." }),
  writerName: z
    .string()
    .trim()
    .min(1, "작성자 이름을 입력해주세요.")
    .max(40, "작성자 이름은 최대 40자입니다."),
});

export const commentInsertSchema = commentBodySchema.merge(commentContextSchema);

export const commentUpdateSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "내용을 입력해주세요.")
      .max(1000, "내용은 최대 1000자입니다.")
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "적어도 한 개 이상의 필드를 제공해야 합니다.",
  });

export const commentListOptionsSchema = z.object({
  parentType: parentTypeEnum,
  parentId: z.string().uuid({ message: "parentId는 UUID 형식이어야 합니다." }),
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
});
