import { z } from "zod";

import { RECOMMEND_RECIPE_SORTS, RECOMMEND_SOURCE_TYPES } from "./types";
import { VIEW_HISTORY_LIMIT } from "./view-history";

export const MAX_RECOMMEND_QUERY_LENGTH = 200;
export const MAX_RECOMMEND_INGREDIENTS = 20;
export const MAX_RECOMMEND_RESULTS = 10;
// 결과 개수는 AI가 임의로 키우지 못하게 서버에서 고정한다. RPC 내부 상한은 최후 방어선이다.
export const RECOMMENDATION_MATCH_COUNT = 8;

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

const recommendationTextFilterSchema = z
  .string()
  .trim()
  .min(1, "검색 조건은 비어 있을 수 없습니다.")
  .max(120, "검색 조건은 120자 이하만 가능합니다.");

const recommendationIngredientListSchema = z
  .array(recommendIngredientSchema)
  .max(
    MAX_RECOMMEND_INGREDIENTS,
    `재료는 최대 ${MAX_RECOMMEND_INGREDIENTS}개까지 지정할 수 있습니다.`
  )
  .optional()
  .default([])
  .transform((ingredients) => [...new Set(ingredients)]);

export const recommendationSearchSchema = z
  .object({
    // "비 오는 날 먹기 좋은 음식" 같은 모호한 맥락은 가공하지 않고 벡터 검색용 query로 보낸다.
    query: z
      .string()
      .trim()
      .min(1, "추천 검색어가 필요합니다.")
      .max(
        MAX_RECOMMEND_QUERY_LENGTH,
        `검색어는 ${MAX_RECOMMEND_QUERY_LENGTH}자 이하만 가능합니다.`
      ),
    sourceTypes: z
      .array(z.enum(RECOMMEND_SOURCE_TYPES))
      .min(1, "검색 대상을 한 개 이상 지정해야 합니다.")
      .max(RECOMMEND_SOURCE_TYPES.length)
      .optional()
      .default([...RECOMMEND_SOURCE_TYPES])
      .transform((sourceTypes) => [...new Set(sourceTypes)]),
    // 아래 값들은 사용자가 명시했을 때만 넣는 정확한 DB 필터다. 없으면 의미 검색만 수행한다.
    category: recommendationTextFilterSchema.optional(),
    difficulty: recommendationTextFilterSchema.optional(),
    maxTimeMinutes: z
      .number({ invalid_type_error: "최대 조리 시간은 숫자여야 합니다." })
      .int("최대 조리 시간은 정수여야 합니다.")
      .min(1, "최대 조리 시간은 1분 이상이어야 합니다.")
      .max(1440, "최대 조리 시간은 1440분 이하여야 합니다.")
      .optional(),
    toolsRequired: z.boolean().optional(),
    includeIngredients: recommendationIngredientListSchema,
    excludeIngredients: recommendationIngredientListSchema,
  })
  .superRefine((value, context) => {
    const excluded = new Set(
      value.excludeIngredients.map((ingredient) => ingredient.toLocaleLowerCase("ko-KR"))
    );
    const overlap = value.includeIngredients.find((ingredient) =>
      excluded.has(ingredient.toLocaleLowerCase("ko-KR"))
    );

    if (overlap) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["excludeIngredients"],
        message: `포함 재료와 제외 재료에 같은 값이 있습니다: ${overlap}`,
      });
    }
  });

export type RecommendationSearchInput = z.input<typeof recommendationSearchSchema>;

const viewedContentSchema = z.object({
  sourceType: z.enum(RECOMMEND_SOURCE_TYPES),
  sourceId: z.string().uuid("조회 기록의 콘텐츠 ID가 올바르지 않습니다."),
  viewedAt: z.number().finite(),
  // viewCount를 저장하기 전에 쌓인 조회 기록에는 값이 없으므로 한 번 본 것으로 본다.
  viewCount: z
    .number({ invalid_type_error: "본 횟수는 숫자여야 합니다." })
    .int("본 횟수는 정수여야 합니다.")
    .min(1, "본 횟수는 1 이상이어야 합니다.")
    .optional()
    .default(1),
});

// 맞춤 추천 요청은 브라우저 세션의 조회 기록만 받는다.
// 사용자 ID는 서버 세션에서, 임베딩 모델과 추천 개수는 서버 설정에서 정한다.
export const personalRecommendationRequestSchema = z.object({
  items: z
    .array(viewedContentSchema)
    .max(VIEW_HISTORY_LIMIT, `조회 기록은 최대 ${VIEW_HISTORY_LIMIT}개까지 보낼 수 있습니다.`),
});
