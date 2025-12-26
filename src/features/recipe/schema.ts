import { z } from "zod";

// 대표 이미지는 서버에서 최종 URL을 받지만, 폼 단계에서는 빈 문자열을 허용하고 undefined로 정규화
const imageFieldSchema = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.string().trim().min(1, "이미지 경로를 확인해 주세요.").max(2048, "이미지 경로는 2048자 이하만 가능합니다.").optional());

export const imageFileSchema = z
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

const tagSchema = z
  .string()
  .trim()
  .min(1, "태그는 1자 이상이어야 합니다.")
  .max(50, "태그는 50자 이하만 가능합니다.");

const ingredientItemSchema = z.object({
  name: z.string().trim().min(1, "재료명을 입력해 주세요.").max(200),
  amount: z.string().trim().max(100).optional().default(""),
  unit: z.string().trim().max(50).optional().default(""),
  unitCustom: z.string().trim().max(100).optional().default(""),
});

const recipeStepSchema = z.object({
  stepindex: z.number().int().min(1).optional(),
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

  steps: z.array(recipeStepSchema),

  ingredients: z
    .array(ingredientItemSchema)
    .min(1, "재료를 한 개 이상 입력해 주세요.")
    .max(200, "재료는 최대 200개까지 입력할 수 있습니다."),
  image: imageFieldSchema,
  category: z.string().trim().max(120, "카테고리는 120자 이하만 가능합니다.").nullable().optional(),
  tags: z.array(tagSchema).max(20, "태그는 최대 20개까지 추가할 수 있습니다.").optional(),
  difficulty: z.string().trim().max(50, "난이도는 50자 이하만 가능합니다.").nullable().optional(),
  time_minutes: z
    .number({ invalid_type_error: "소요 시간은 숫자로 입력해 주세요." })
    .int("소요 시간은 정수로 입력해 주세요.")
    .min(0, "소요 시간은 0 이상이어야 합니다.")
    .nullable()
    .optional(),
  servings: z
    .number({ invalid_type_error: "인분은 숫자로 입력해 주세요." })
    .int("인분은 정수로 입력해 주세요.")
    .min(1, "인분은 1 이상이어야 합니다.")
    .max(50, "인분은 50 이하로 입력해 주세요.")
    .nullable()
    .optional(),
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
      .max(200, "제목은 200자 이하만 가능합니다.")
      .optional(),
    summary: z.string().trim().max(500, "요약은 500자 이하만 가능합니다.").nullable().optional(),
    steps: z.array(recipeStepSchema),
    ingredients: z
      .array(ingredientItemSchema)
      .min(1, "재료를 한 개 이상 입력해 주세요.")
      .optional(),
    image: imageFieldSchema.optional(),
    category: z
      .string()
      .trim()
      .max(120, "카테고리는 120자 이하만 가능합니다.")
      .nullable()
      .optional(),
    tags: z.array(tagSchema).max(20, "태그는 최대 20개까지 추가할 수 있습니다.").optional(),
    difficulty: z.string().trim().max(50, "난이도는 50자 이하만 가능합니다.").nullable().optional(),
    time_minutes: z
      .number({ invalid_type_error: "소요 시간은 숫자로 입력해 주세요." })
      .int("소요 시간은 정수로 입력해 주세요.")
      .min(0, "소요 시간은 0 이상이어야 합니다.")
      .nullable()
      .optional(),
    servings: z
      .number({ invalid_type_error: "인분은 숫자로 입력해 주세요." })
      .int("인분은 정수로 입력해 주세요.")
      .min(1, "인분은 1 이상이어야 합니다.")
      .max(50, "인분은 50 이하로 입력해 주세요.")
      .nullable()
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 필드를 한 가지 이상 입력해 주세요.",
  });

export const recipeListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  page: z.number().int().min(1).optional(),
  tags: z.array(tagSchema).optional(),
  writerUid: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});

export const requestRecipeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  summary: z.string().nullable().optional(),
  steps: z.array(recipeStepSchema),
  ingredients: z.array(ingredientItemSchema),
  image: z.string().trim().min(1),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export type RecipeInsertSchema = z.infer<typeof recipeInsertSchema>;
export type RecipeUpdateSchema = z.infer<typeof recipeUpdateSchema>;
export type RecipeListOptionsSchema = z.infer<typeof recipeListOptionsSchema>;
