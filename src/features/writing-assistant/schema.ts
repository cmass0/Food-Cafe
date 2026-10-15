import { z } from "zod";
import { recipeInsertSchema } from "@/domain/recipe/schema";
import { ComboInsertSchema, MIN_COMBO_ITEMS, MAX_COMBO_ITEMS } from "@/domain/combo/schema";
import { RECIPE_CATEGORIES } from "@/domain/recipe/category";
import { difficultyLabels } from "@/domain/recipe/difficulty";
import { INGREDIENT_UNITS } from "@/domain/recipe/ingredient-unit";

export const MAX_WRITING_QUESTIONS = 5;
const text = (max: number) => z.string().trim().min(1).max(max);
const difficulty = z.enum(difficultyLabels as [string, ...string[]]);
// 저장하지 않는 안내 목록은 상한을 넘어도 실패시키지 않고 앞에서부터 자른다.
// 재료·단계·태그처럼 폼에 들어갈 내용은 자르면 초안이 몰래 바뀌므로 그대로 검증한다.
const guideList = (item: z.ZodString, { min = 0, max }: { min?: number; max: number }) =>
  z.preprocess(
    (value) => (Array.isArray(value) ? value.slice(0, max) : value),
    z.array(item).min(min).max(max)
  );
export const writingOutlineSchema = z.object({
  title: text(200),
  points: guideList(text(100), { min: 1, max: 5 }),
});
export const writingQuestionSchema = z.object({
  topic: text(40),
  text: text(300),
  options: guideList(text(100), { max: 4 }),
});

// 저장 스키마를 재사용하되, AI가 이미지·작성자·DB 식별자를 생성하지 못하게 제외한다.
export const recipeDraftSchema = recipeInsertSchema
  .omit({
    id: true,
    image: true,
    images: true,
    writer_uid: true,
    tools_required: true,
  })
  .extend({
    summary: z.string().max(500),
    chef_tip: z.string().max(500),
    category: z.enum(RECIPE_CATEGORIES),
    difficulty,
    tags: recipeInsertSchema.shape.tags.unwrap(),
    tools: z.array(text(50)).max(10),
    time_minutes: z.number().int().min(1).max(1440),
    ingredients: z
      .array(
        z
          .object({
            name: text(200),
            amount: text(100),
            unit: z.enum(INGREDIENT_UNITS),
            unitCustom: z.string().max(100),
          })
          .superRefine((value, ctx) => {
            if (value.unit === "custom" && !value.unitCustom.trim()) {
              ctx.addIssue({
                code: "custom",
                path: ["unitCustom"],
                message: "직접 입력 단위가 필요합니다.",
              });
            }
          })
      )
      .min(1)
      .max(30),
  });
export const comboDraftSchema = ComboInsertSchema.omit({
  id: true,
  image: true,
  writer_uid: true,
  tools_required: true,
  items: true,
}).extend({
  summary: z.string().max(500),
  difficulty,
  time_minutes: z.number().int().min(1).max(1440),
  tags: ComboInsertSchema.shape.tags.unwrap(),
  tools: z.array(text(50)).max(20),
  items: z
    .array(
      z.discriminatedUnion("type", [
        // 레시피 항목의 설명·이미지는 폼에 불러온 원본을 쓰고, 제목은 workflow가 선택한 레시피 제목으로 바꾼다.
        z.object({
          type: z.literal("recipe"),
          recipeid: z.string().uuid(),
          title: text(200),
        }),
        z.object({
          type: z.literal("product"),
          productName: text(200),
          summary: z.string().max(500),
        }),
      ])
    )
    .min(MIN_COMBO_ITEMS)
    .max(MAX_COMBO_ITEMS),
});
const responseFields = {
  outline: writingOutlineSchema,
  question: writingQuestionSchema.nullable(),
  suggestions: guideList(text(300), { max: 12 }),
};
export const recipeWritingResponseSchema = z.object({
  ...responseFields,
  kind: z.literal("recipe"),
  draft: recipeDraftSchema.nullable(),
});
export const comboWritingResponseSchema = z.object({
  ...responseFields,
  kind: z.literal("combo"),
  draft: comboDraftSchema.nullable(),
});
export const writingResponseSchema = z.discriminatedUnion("kind", [
  recipeWritingResponseSchema,
  comboWritingResponseSchema,
]);
export const writingRequestSchema = z.object({
  kind: z.enum(["recipe", "combo"]),
  memo: z.string().trim().max(2000),
  formContext: z.string().max(24000),
  recipeReferences: z
    .array(z.object({ id: z.string().uuid(), title: text(200) }))
    .max(MAX_COMBO_ITEMS),
  turns: z.array(z.object({ question: text(300), answer: text(2000) })).max(MAX_WRITING_QUESTIONS),
  outline: writingOutlineSchema.nullable(),
  finish: z.boolean(),
});
