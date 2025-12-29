import { imageFieldSchema, imageFileSchema, tagSchema } from "@/lib/domain/schema";
import { z } from "zod";

export const comboListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  page: z.number().int().min(1).optional(),
  tag: z.array(tagSchema).optional(),
  writerUid: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});

export const ComboSetpsSchema = z.object({
  description: z.string().min(1, "조리 단계를 입력해주세요.").max(1000),
});

export const ComboItemsSchema = z.array(
  z.union([
    z.object({
      type: z.literal("recipe"),
      recipeid: z.string().uuid(),
      summary: z.string().max(500).optional(),
    }),
    z.object({
      type: z.literal("product"),
      productName: z.string().min(1, "상품명을 입력해주세요.").max(200),
      summary: z.string().max(500).optional(),
    }),
  ])
);

export const ComboInsertSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "제목을 입력해주세요.").max(200, "제목은 200자 이하만 가능합니다."),
  summary: z.string().max(500, "요약은 500자 이하만 가능합니다.").optional(),
  steps: z.array(ComboSetpsSchema).min(1, "조리 단계를 한 개 이상 입력해주세요."),
  items: ComboItemsSchema,
  tags: z.array(tagSchema).max(20, "태그는 최대 20개까지 추가할 수 있습니다.").optional(),
  difficulty: z
    .string()
    .min(1, "난이도를 입력해주세요.")
    .max(50, "난이도는 50자 이하만 가능합니다."),
  time_minutes: z
    .number({ invalid_type_error: "소요 시간은 숫자여야 합니다." })
    .int()
    .min(1, "조리 시간을 입력해주세요.")
    .optional(),
  tools_required: z.boolean(),
  image: imageFieldSchema,
});

export const ComboFormSchema = ComboInsertSchema.omit({ id: true, image: true }).extend({
  imageFile: imageFileSchema,
});

export const ComboUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, "제목을 입력해주세요.")
      .max(200, "제목은 200자 이하만 가능합니다.")
      .optional(),
    summary: z.string().max(500, "요약은 500자 이하만 가능합니다.").optional(),
    steps: z.array(ComboSetpsSchema).min(1, "조리 단계를 한 개 이상 입력해주세요.").optional(),
    items: ComboItemsSchema.optional(),
    tags: z.array(tagSchema).max(20, "태그는 최대 20개까지 추가할 수 있습니다.").optional(),
    difficulty: z
      .string()
      .min(1, "난이도를 입력해주세요.")
      .max(50, "난이도는 50자 이하만 가능합니다.")
      .optional(),
    time_minutes: z
      .number({ invalid_type_error: "소요 시간은 숫자여야 합니다." })
      .int()
      .min(1, "조리 시간을 입력해주세요.")
      .optional(),
    tools_required: z.boolean().optional(),
    image: imageFieldSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "수정할 필드를 한 가지 이상 입력해 주세요.",
  });
