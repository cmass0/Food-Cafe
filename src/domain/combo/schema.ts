import { imageFieldSchema, tagSchema } from "@/lib/domain/schema";
import { z } from "zod";
import { imageFileSchema } from "./../../lib/domain/schema";
import { COMBO_RECIPE_REFERENCE_ERRORS } from "./messages";

// 비어 있으면 입력 안내, 형식이 틀리면 형식 안내를 먼저 보여준다(폼은 경로마다 첫 오류만 표시).
export const comboRecipeIdSchema = z
  .string()
  .min(1, COMBO_RECIPE_REFERENCE_ERRORS.required)
  .uuid(COMBO_RECIPE_REFERENCE_ERRORS.invalid);

export const MIN_COMBO_ITEMS = 2;
export const MAX_COMBO_ITEMS = 10;
// 조리 단계 상한. 레시피(domain/recipe/schema.ts)와 같은 값이고, 작성 화면과 DB 제약도 이 값을 따른다.
export const MAX_COMBO_STEPS = 50;
export const MAX_COMBO_STEP_CHARS = 500;
export const MAX_COMBO_TAGS = 20;
export const MAX_COMBO_TOOLS = 20;
// 글자 수 상한. 작성 화면 입력칸과 DB 제약(combos_*_length)도 이 값을 따른다.
export const COMBO_TEXT_LIMITS = { title: 200, summary: 500, difficulty: 50 } as const;
export const COMBO_ITEM_TEXT_LIMITS = { title: 200, summary: 500, productName: 200 } as const;

const comboItemsMinMessage = `조합 항목은 최소 ${MIN_COMBO_ITEMS}개 이상 추가해 주세요.`;
const comboItemsMaxMessage = `조합 항목은 최대 ${MAX_COMBO_ITEMS}개까지 추가할 수 있습니다.`;

export const comboListOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  page: z.number().int().min(1).optional(),
  writerUid: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  searchField: z.enum(["tag", "title", "tag_title", "writer"]).optional(),
  sort: z.enum(["recent", "like", "view"]).optional(),
});

export const ComboSetpsSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "조리 단계를 입력해주세요.")
    .max(MAX_COMBO_STEP_CHARS, `단계는 ${MAX_COMBO_STEP_CHARS}자 이하로 입력해 주세요.`),
});
const ComboStepsSchema = z
  .array(ComboSetpsSchema)
  .max(MAX_COMBO_STEPS, `조리 단계는 최대 ${MAX_COMBO_STEPS}개까지 입력할 수 있습니다.`);

// comboitem의 image는 product에서만 파일 업로드를 위해 사용
export const ComboItemsSchema = z
  .array(
    z.union([
      z.object({
        type: z.literal("recipe"),
        recipeid: comboRecipeIdSchema,
        title: z.string().max(COMBO_ITEM_TEXT_LIMITS.title).optional(),
        summary: z.string().max(COMBO_ITEM_TEXT_LIMITS.summary).optional(),
        image: imageFieldSchema,
      }),
      z.object({
        type: z.literal("product"),
        productName: z
          .string()
          .min(1, "상품명을 입력해주세요.")
          .max(COMBO_ITEM_TEXT_LIMITS.productName),
        summary: z.string().max(COMBO_ITEM_TEXT_LIMITS.summary).optional(),
        image: imageFieldSchema,
      }),
    ])
  )
  .min(MIN_COMBO_ITEMS, comboItemsMinMessage)
  .max(MAX_COMBO_ITEMS, comboItemsMaxMessage);
// ComboItems의 image 필드는 form에서 File(새 업로드) 또는 string(업데이트시 기존 url) 허용
const comboItemImageFormSchema = z.preprocess(
  (value) => (value == null ? undefined : value),
  z.union([imageFileSchema, imageFieldSchema]).optional()
);

// ComboItems의 image 필드는 form에서 File 또는 string을 입력받음
export const ComboItemsSchemaAtForm = z
  .array(
    z.union([
      z
        .object({
          type: z.literal("recipe"),
          recipeid: comboRecipeIdSchema,
          title: z.string().max(COMBO_ITEM_TEXT_LIMITS.title).optional(),
          summary: z.string().max(COMBO_ITEM_TEXT_LIMITS.summary).optional(),
          image: imageFieldSchema,
        })
        // 폼에서는 레시피를 불러와 제목이 채워진 칸만 저장한다. 없는 레시피를 저장 전에 그 칸에서 알리려는 것이고,
        // 저장할 때는 서버가 제목·설명·사진을 DB 값으로 다시 채운다.
        .refine((item) => Boolean(item.title?.trim()), {
          path: ["recipeid"],
          message: COMBO_RECIPE_REFERENCE_ERRORS.notLoaded,
        }),
      z.object({
        type: z.literal("product"),
        productName: z
          .string()
          .min(1, "상품명을 입력해주세요.")
          .max(COMBO_ITEM_TEXT_LIMITS.productName),
        summary: z.string().max(COMBO_ITEM_TEXT_LIMITS.summary).optional(),
        image: comboItemImageFormSchema,
      }),
    ])
  )
  .min(MIN_COMBO_ITEMS, comboItemsMinMessage)
  .max(MAX_COMBO_ITEMS, comboItemsMaxMessage);

export const ComboInsertSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .min(1, "제목을 입력해주세요.")
    .max(COMBO_TEXT_LIMITS.title, `제목은 ${COMBO_TEXT_LIMITS.title}자 이하만 가능합니다.`),
  summary: z
    .string()
    .max(COMBO_TEXT_LIMITS.summary, `요약은 ${COMBO_TEXT_LIMITS.summary}자 이하만 가능합니다.`)
    .optional(),
  steps: ComboStepsSchema.min(1, "조리 단계를 한 개 이상 입력해주세요."),
  items: ComboItemsSchema,
  tags: z
    .array(tagSchema)
    .max(MAX_COMBO_TAGS, `태그는 최대 ${MAX_COMBO_TAGS}개까지 추가할 수 있습니다.`)
    .optional(),
  tools: z.array(tagSchema).max(MAX_COMBO_TOOLS).nullable().optional(),
  difficulty: z
    .string()
    .min(1, "난이도를 입력해주세요.")
    .max(
      COMBO_TEXT_LIMITS.difficulty,
      `난이도는 ${COMBO_TEXT_LIMITS.difficulty}자 이하만 가능합니다.`
    ),
  time_minutes: z
    .number({ invalid_type_error: "소요 시간은 숫자여야 합니다." })
    .int()
    .min(1, "조리 시간을 입력해주세요.")
    .optional(),
  tools_required: z.boolean().optional(),
  image: imageFieldSchema,
  writer_uid: z.string().uuid().optional(),
});

// 폼용 이미지 스키마 File(새 업로드) 또는 string(업데이트시 기존 url사용) 허용
const imageFormSchema = z.union([imageFileSchema, imageFieldSchema]).nullable().optional();

export const ComboFormSchema = ComboInsertSchema.omit({
  id: true,
  image: true,
  items: true,
  writer_uid: true,
}).extend({
  image: imageFormSchema.refine((image) => Boolean(image), {
    message: "대표 이미지를 선택해 주세요.",
  }),
  items: ComboItemsSchemaAtForm,
});

export const ComboUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, "제목을 입력해주세요.")
      .max(COMBO_TEXT_LIMITS.title, `제목은 ${COMBO_TEXT_LIMITS.title}자 이하만 가능합니다.`)
      .optional(),
    summary: z
      .string()
      .max(COMBO_TEXT_LIMITS.summary, `요약은 ${COMBO_TEXT_LIMITS.summary}자 이하만 가능합니다.`)
      .optional(),
    steps: ComboStepsSchema.min(1, "조리 단계를 한 개 이상 입력해주세요.").optional(),
    items: ComboItemsSchema.optional(),
    tags: z
      .array(tagSchema)
      .max(MAX_COMBO_TAGS, `태그는 최대 ${MAX_COMBO_TAGS}개까지 추가할 수 있습니다.`)
      .optional(),
    tools: z.array(tagSchema).max(MAX_COMBO_TOOLS).nullable().optional(),
    difficulty: z
      .string()
      .min(1, "난이도를 입력해주세요.")
      .max(
        COMBO_TEXT_LIMITS.difficulty,
        `난이도는 ${COMBO_TEXT_LIMITS.difficulty}자 이하만 가능합니다.`
      )
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
