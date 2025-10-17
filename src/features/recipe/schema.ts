import { z } from "zod";

export const recipeIdTextSchema = z
  .string()
  .trim()
  .min(1, "레거시 ID를 입력해 주세요.")
  .max(128, "레거시 ID는 128자 이하만 가능합니다.");

const imageUrlSchema = z
  .string()
  .trim()
  .url("올바른 이미지 URL을 입력해 주세요.")
  .max(2048, "이미지 URL은 2048자 이하만 가능합니다.");

const tagSchema = z
  .string()
  .trim()
  .min(1, "태그는 1자 이상이어야 합니다.")
  .max(50, "태그는 50자 이하만 가능합니다.");

export const recipeInsertSchema = z.object({
  idTextOld: recipeIdTextSchema.optional(),
  legacyId: z
    .string()
    .trim()
    .max(128, "legacyId는 128자 이하만 가능합니다.")
    .nullable()
    .optional(),
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
  recipe: z
    .string()
    .trim()
    .min(1, "레시피 내용을 입력해 주세요."),
  image: imageUrlSchema,
  images: z.array(imageUrlSchema).max(12, "이미지는 최대 12개까지 추가할 수 있습니다.").optional(),
  category: z
    .string()
    .trim()
    .max(120, "카테고리는 120자 이하만 가능합니다.")
    .nullable()
    .optional(),
  tags: z.array(tagSchema).max(20, "태그는 최대 20개까지 추가할 수 있습니다.").optional(),
  status: z.number().int().min(0).max(9).nullable().optional(),
  writerUid: z.string().uuid("작성자 UID가 올바르지 않습니다.").nullable().optional(),
  writerUidLegacy: z
    .string()
    .trim()
    .max(120, "레거시 UID는 120자 이하만 가능합니다.")
    .nullable()
    .optional(),
  writerName: z
    .string()
    .trim()
    .max(120, "작성자 이름은 120자 이하만 가능합니다.")
    .nullable()
    .optional(),
  writerEmail: z.string().email("이메일 형식이 올바르지 않습니다.").nullable().optional(),
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
    recipe: z
      .string()
      .trim()
      .min(1, "레시피 내용을 입력해 주세요.")
      .nullable()
      .optional(),
    image: imageUrlSchema.optional(),
    images: z.array(imageUrlSchema).max(12, "이미지는 최대 12개까지 추가할 수 있습니다.").optional(),
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
  cursor: z.string().min(1).optional(),
  tag: tagSchema.optional(),
  status: z.number().int().optional(),
  writerUid: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});

export type RecipeInsertSchema = z.infer<typeof recipeInsertSchema>;
export type RecipeUpdateSchema = z.infer<typeof recipeUpdateSchema>;
export type RecipeListOptionsSchema = z.infer<typeof recipeListOptionsSchema>;