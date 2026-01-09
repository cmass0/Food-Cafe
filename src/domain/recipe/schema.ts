import { imageFieldSchema, imageFileSchema, tagSchema } from "@/lib/domain/schema";
import { z } from "zod";

const ingredientItemSchema = z
  .object({
    name: z.string().trim().min(1, "재료명을 입력해 주세요.").max(200),
    amount: z.string().trim().min(1, "수량을 입력해 주세요.").max(100),
    unit: z.string().trim().min(1, "단위를 선택해 주세요.").max(50),
    unitCustom: z.string().trim().max(100).optional(),
  })
  // 단위가 custom일 때는 unitCustom이 반드시 필요하도록 검사
  .superRefine((value, ctx) => {
    if (value.unit === "custom" && !value.unitCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "단위를 직접 입력해 주세요.",
        path: ["unitCustom"],
      });
    }
  });

const recipeStepSchema = z.object({
  description: z.string().trim().min(1, "내용을 입력해 주세요."),
});

export const recipeInsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(200, "제목은 200자 이하만 가능합니다."),
  summary: z.string().trim().max(500, "요약은 500자 이하만 가능합니다.").nullable().optional(),
  steps: z.array(recipeStepSchema).min(1, "단계를 한 개 이상 입력해 주세요."),
  ingredients: z
    .array(ingredientItemSchema)
    .min(1, "재료를 한 개 이상 입력해 주세요.")
    .max(200, "재료는 최대 200개까지 입력할 수 있습니다."),
  image: imageFieldSchema,
  category: z.string().trim().max(120, "카테고리는 120자 이하만 가능합니다."),
  tags: z.array(tagSchema).max(10, "태그는 최대 10개까지 추가할 수 있습니다.").optional(),
  tools: z
    .array(tagSchema)
    .max(10, "조리도구는 최대 10개까지 추가할 수 있습니다.")
    .nullable()
    .optional(),
  tools_required: z.boolean().optional(),
  difficulty: z.string().trim().max(50, "난이도는 50자 이하만 가능합니다."),
  time_minutes: z
    .number({ invalid_type_error: "소요 시간은 숫자로 입력해 주세요." })
    .int("소요 시간은 정수로 입력해 주세요.")
    .min(0, "소요 시간은 0 이상이어야 합니다."),
  servings: z
    .number({ invalid_type_error: "인분은 숫자로 입력해 주세요." })
    .int("인분은 정수로 입력해 주세요.")
    .min(1, "인분은 1 이상이어야 합니다.")
    .max(50, "인분은 50 이하로 입력해 주세요."),
});

export const recipeFormSchema = recipeInsertSchema.omit({ image: true, id: true }).extend({
  imageFile: imageFileSchema,
});

export const recipeUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "제목을 입력해 주세요.")
      .max(200, "제목은 200자 이하만 가능합니다."),
    summary: z.string().trim().max(500, "요약은 500자 이하만 가능합니다.").nullable().optional(),
    steps: z.array(recipeStepSchema),
    ingredients: z
      .array(ingredientItemSchema)
      .min(1, "재료를 한 개 이상 입력해 주세요.")
      .optional(),
    image: imageFieldSchema,

    category: z.string().trim().max(120, "카테고리는 120자 이하만 가능합니다."),
    tags: z.array(tagSchema).max(20, "태그는 최대 20개까지 추가할 수 있습니다.").optional(),
    tools: z
      .array(tagSchema)
      .max(20, "조리도구는 최대 20개까지 추가할 수 있습니다.")
      .nullable()
      .optional(),
    tools_required: z.boolean().optional(),
    difficulty: z.string().trim().max(50, "난이도는 50자 이하만 가능합니다."),
    time_minutes: z
      .number({ invalid_type_error: "소요 시간은 숫자로 입력해 주세요." })
      .int("소요 시간은 정수로 입력해 주세요.")
      .min(0, "소요 시간은 0 이상이어야 합니다."),
    servings: z
      .number({ invalid_type_error: "인분은 숫자로 입력해 주세요." })
      .int("인분은 정수로 입력해 주세요.")
      .min(1, "인분은 1 이상이어야 합니다.")
      .max(50, "인분은 50 이하로 입력해 주세요."),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 필드를 한 가지 이상 입력해 주세요.",
  });

export const recipeListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  page: z.number().int().min(1).optional(),
  writerUid: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  searchField: z.enum(["tag", "title", "tag_title", "writer"]).optional(),
});


