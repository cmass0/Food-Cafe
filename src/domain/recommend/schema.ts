import { z } from "zod";

import { RECOMMEND_RECIPE_SORTS } from "./types";

export const MAX_RECOMMEND_QUERY_LENGTH = 200;
export const MAX_RECOMMEND_INGREDIENTS = 20;
export const MAX_RECOMMEND_RESULTS = 10;

const recommendIngredientSchema = z
  .string()
  .trim()
  .min(1, "재료명은 비어 있을 수 없습니다.")
  .max(100, "재료명은 100자 이하만 가능합니다.");

export const recommendRecipeSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .max(MAX_RECOMMEND_QUERY_LENGTH, `검색어는 ${MAX_RECOMMEND_QUERY_LENGTH}자 이하만 가능합니다.`)
    .optional()
    .default(""),
  ingredients: z
    .array(recommendIngredientSchema)
    .max(
      MAX_RECOMMEND_INGREDIENTS,
      `재료는 최대 ${MAX_RECOMMEND_INGREDIENTS}개까지 지정할 수 있습니다.`
    )
    .optional()
    .default([])
    .transform((ingredients) => [...new Set(ingredients)]),
  maxTimeMinutes: z
    .number({ invalid_type_error: "최대 조리 시간은 숫자여야 합니다." })
    .int("최대 조리 시간은 정수여야 합니다.")
    .min(1, "최대 조리 시간은 1분 이상이어야 합니다.")
    .max(1440, "최대 조리 시간은 1440분 이하여야 합니다.")
    .optional(),
  sort: z.enum(RECOMMEND_RECIPE_SORTS).optional().default("popular"),
  limit: z
    .number({ invalid_type_error: "검색 개수는 숫자여야 합니다." })
    .int("검색 개수는 정수여야 합니다.")
    .min(1, "검색 개수는 1개 이상이어야 합니다.")
    .max(MAX_RECOMMEND_RESULTS, `검색 결과는 최대 ${MAX_RECOMMEND_RESULTS}개까지 가능합니다.`)
    .optional()
    .default(5),
});

export type RecommendRecipeSearchInput = z.input<typeof recommendRecipeSearchSchema>;
