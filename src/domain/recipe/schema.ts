import { imageFieldSchema, tagSchema } from "@/lib/domain/schema";
import { z } from "zod";
import { isRecipeCategory, RECIPE_CATEGORY_KEYS } from "./category";

export const MAX_RECIPE_TAGS = 10;
export const MAX_RECIPE_TOOLS = 10;
// 조리 단계 상한. 작성 화면(StepsFields)과 DB 제약(recipes_steps_count·recipes_steps_size)도 이 값을 따른다.
export const MAX_RECIPE_STEPS = 50;
export const MAX_RECIPE_STEP_CHARS = 500;
// 글자 수·재료 개수 상한. 작성 화면 입력칸과 DB 제약(recipes_*_length)도 이 값을 따른다.
export const RECIPE_TEXT_LIMITS = {
  title: 200,
  summary: 500,
  chefTip: 500,
  difficulty: 50,
} as const;
export const MAX_RECIPE_INGREDIENTS = 200;
export const INGREDIENT_TEXT_LIMITS = {
  name: 200,
  amount: 100,
  unit: 50,
  unitCustom: 100,
} as const;

// 카테고리는 고르지 않아도 된다(빈 문자열). 고르면 작성 폼 목록의 값만 받는다.
// 목록 밖 값이 저장되면 홈 카테고리 필터에서 그 레시피를 찾을 수 없다.
const recipeCategorySchema = z
  .string()
  .trim()
  // 반환 타입을 boolean으로 적어 타입 좁히기로 추론되지 않게 한다. 좁혀지면 폼 기본값(string)과 타입이 어긋난다.
  .refine(
    (value): boolean => value === "" || isRecipeCategory(value),
    "카테고리는 목록에서 골라 주세요."
  );

const recipeTagsSchema = z
  .array(tagSchema)
  .max(MAX_RECIPE_TAGS, `태그는 최대 ${MAX_RECIPE_TAGS}개까지 추가할 수 있습니다.`);

const recipeToolsSchema = z
  .array(tagSchema)
  .max(MAX_RECIPE_TOOLS, `조리도구는 최대 ${MAX_RECIPE_TOOLS}개까지 추가할 수 있습니다.`);

const imageListSchema = z
  .array(z.string().trim().min(1).max(2048, "이미지 경로는 2048자 이하만 가능합니다."))
  .max(10, "이미지는 최대 10장까지 추가할 수 있습니다.")
  .optional();

const recipeIngredientsMaxMessage = `재료는 최대 ${MAX_RECIPE_INGREDIENTS}개까지 입력할 수 있습니다.`;

const ingredientItemSchema = z
  .object({
    name: z.string().trim().min(1, "재료명을 입력해 주세요.").max(INGREDIENT_TEXT_LIMITS.name),
    amount: z.string().trim().min(1, "수량을 입력해 주세요.").max(INGREDIENT_TEXT_LIMITS.amount),
    unit: z.string().trim().min(1, "단위를 선택해 주세요.").max(INGREDIENT_TEXT_LIMITS.unit),
    unitCustom: z.string().trim().max(INGREDIENT_TEXT_LIMITS.unitCustom).optional(),
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
  description: z
    .string()
    .trim()
    .min(1, "내용을 입력해 주세요.")
    .max(MAX_RECIPE_STEP_CHARS, `단계는 ${MAX_RECIPE_STEP_CHARS}자 이하로 입력해 주세요.`),
});
const recipeStepsSchema = z
  .array(recipeStepSchema)
  .max(MAX_RECIPE_STEPS, `조리 단계는 최대 ${MAX_RECIPE_STEPS}개까지 입력할 수 있습니다.`);

export const recipeInsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(RECIPE_TEXT_LIMITS.title, `제목은 ${RECIPE_TEXT_LIMITS.title}자 이하만 가능합니다.`),
  summary: z
    .string()
    .trim()
    .max(RECIPE_TEXT_LIMITS.summary, `요약은 ${RECIPE_TEXT_LIMITS.summary}자 이하만 가능합니다.`)
    .nullable()
    .optional(),
  chef_tip: z
    .string()
    .trim()
    .max(
      RECIPE_TEXT_LIMITS.chefTip,
      `셰프의 팁은 ${RECIPE_TEXT_LIMITS.chefTip}자 이하만 가능합니다.`
    )
    .nullable()
    .optional(),
  steps: recipeStepsSchema.min(1, "단계를 한 개 이상 입력해 주세요."),
  ingredients: z
    .array(ingredientItemSchema)
    .min(1, "재료를 한 개 이상 입력해 주세요.")
    .max(MAX_RECIPE_INGREDIENTS, recipeIngredientsMaxMessage),
  image: imageFieldSchema,
  images: imageListSchema,
  category: recipeCategorySchema,
  tags: recipeTagsSchema.optional(),
  tools: recipeToolsSchema.nullable().optional(),
  tools_required: z.boolean().optional(),
  difficulty: z
    .string()
    .trim()
    .max(
      RECIPE_TEXT_LIMITS.difficulty,
      `난이도는 ${RECIPE_TEXT_LIMITS.difficulty}자 이하만 가능합니다.`
    ),
  time_minutes: z
    .number({ invalid_type_error: "소요 시간은 숫자로 입력해 주세요." })
    .int("소요 시간은 정수로 입력해 주세요.")
    .min(0, "소요 시간은 0 이상이어야 합니다."),
  servings: z
    .number({ invalid_type_error: "인분은 숫자로 입력해 주세요." })
    .int("인분은 정수로 입력해 주세요.")
    .min(1, "인분은 1 이상이어야 합니다.")
    .max(50, "인분은 50 이하로 입력해 주세요."),
  writer_uid: z.string().uuid().optional(),
});

// 폼용 이미지 스키마: File(새 업로드) 또는 string(기존 URL) 허용
const imageFormSchema = z
  .union([z.instanceof(File), z.string().min(1)])
  .nullable()
  .optional();

const imageFilesFormSchema = z
  .array(z.union([z.instanceof(File), z.string().min(1)]))
  .max(10, "이미지는 최대 10장까지 추가할 수 있습니다.")
  .optional();

export const recipeFormSchema = recipeInsertSchema
  .omit({ image: true, images: true, id: true })
  .extend({
    imageFile: imageFormSchema.refine((image) => Boolean(image), {
      message: "대표 이미지를 선택해 주세요.",
    }),
    imageFiles: imageFilesFormSchema,
  });

export const recipeUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "제목을 입력해 주세요.")
      .max(RECIPE_TEXT_LIMITS.title, `제목은 ${RECIPE_TEXT_LIMITS.title}자 이하만 가능합니다.`),
    summary: z
      .string()
      .trim()
      .max(RECIPE_TEXT_LIMITS.summary, `요약은 ${RECIPE_TEXT_LIMITS.summary}자 이하만 가능합니다.`)
      .nullable()
      .optional(),
    chef_tip: z
      .string()
      .trim()
      .max(
        RECIPE_TEXT_LIMITS.chefTip,
        `셰프의 팁은 ${RECIPE_TEXT_LIMITS.chefTip}자 이하만 가능합니다.`
      )
      .nullable()
      .optional(),
    steps: recipeStepsSchema,
    ingredients: z
      .array(ingredientItemSchema)
      .min(1, "재료를 한 개 이상 입력해 주세요.")
      .max(MAX_RECIPE_INGREDIENTS, recipeIngredientsMaxMessage)
      .optional(),
    image: imageFieldSchema,
    images: imageListSchema,

    category: recipeCategorySchema,
    tags: recipeTagsSchema.optional(),
    tools: recipeToolsSchema.nullable().optional(),
    tools_required: z.boolean().optional(),
    difficulty: z
      .string()
      .trim()
      .max(
        RECIPE_TEXT_LIMITS.difficulty,
        `난이도는 ${RECIPE_TEXT_LIMITS.difficulty}자 이하만 가능합니다.`
      ),
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

export const MAX_RECIPE_LIST_LIMIT = 50;

export const recipeListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(MAX_RECIPE_LIST_LIMIT).optional(),
  page: z.number().int().min(1).optional(),
  writerUid: z.string().uuid().optional(),
  category: z.enum(RECIPE_CATEGORY_KEYS).optional(),
  search: z.string().trim().max(200).optional(),
  searchField: z.enum(["tag", "title", "tag_title", "writer"]).optional(),
  sort: z.enum(["recent", "like", "view"]).optional(),
});
