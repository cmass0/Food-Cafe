import { z } from "zod";

// 대표 이미지는 파일 업로드로 채워지므로 URL 검증을 강제하지 않고 길이만 제한
const imageFieldSchema = z
  .string()
  .trim()
  .max(2048, "이미지 경로는 2048자 이하만 가능합니다.")
  .nullable()
  .optional();

const tagSchema = z
  .string()
  .trim()
  .min(1, "태그는 1자 이상이어야 합니다.")
  .max(50, "태그는 50자 이하만 가능합니다.");

export const recipeInsertSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(200, "제목은 200자 이하만 가능합니다."),
  summary: z
    .string()
    .trim()
    .max(500, "요약은 500자 이하만 가능합니다.")
    .nullable()
    .optional(),
  // 단계 기반 입력을 허용하기 위해 빈 문자열도 통과시키고, 실제 값은 단계에서 생성
  recipe: z
    .string()
    .trim()
    .max(8000, "레시피는 8000자 이하로 입력해 주세요.")
    .optional(),
  image: imageFieldSchema,
  category: z
    .string()
    .trim()
    .max(120, "카테고리는 120자 이하만 가능합니다.")
    .nullable()
    .optional(),
  tags: z.array(tagSchema).max(20, "태그는 최대 20개까지 추가할 수 있습니다.").optional(),
});

export const recipeUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "제목을 입력해 주세요.")
      .max(200, "제목은 200자 이하만 가능합니다.")
      .optional(),
    summary: z
      .string()
      .trim()
      .max(500, "요약은 500자 이하만 가능합니다.")
      .nullable()
      .optional(),
    recipe: z.string().trim().min(1, "레시피 내용을 입력해 주세요.").nullable().optional(),
    image: imageFieldSchema,
    category: z
      .string()
      .trim()
      .max(120, "카테고리는 120자 이하만 가능합니다.")
      .nullable()
      .optional(),
    tags: z.array(tagSchema).max(20, "태그는 최대 20개까지 추가할 수 있습니다.").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 필드를 한 가지 이상 입력해 주세요.",
  });

export const recipeListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  page: z.number().int().min(1).optional(),
  tag: tagSchema.optional(),
  status: z.number().int().optional(),
  writerUid: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});

export type RecipeInsertSchema = z.infer<typeof recipeInsertSchema>;
export type RecipeUpdateSchema = z.infer<typeof recipeUpdateSchema>;
export type RecipeListOptionsSchema = z.infer<typeof recipeListOptionsSchema>;
