import { toArrayItems, toArraySteps as toArrayComboSteps } from "@/domain/combo/normalization";
import {
  normaliseTextArray,
  toArrayIngredient,
  toArraySteps as toArrayRecipeSteps,
} from "@/domain/recipe/normalization";

import type {
  RecommendationComboDocumentSource,
  RecommendationDocument,
  RecommendationRecipeDocumentSource,
} from "./types";

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function normalizeSearchList(values: string[] | null | undefined): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of normaliseTextArray(values)) {
    const normalized = value.trim();
    if (!normalized) continue;

    const key = normalized.toLocaleLowerCase("ko-KR");
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function normalizeExactNames(values: string[]): string[] {
  return [
    ...new Set(values.map((value) => value.trim().toLocaleLowerCase("ko-KR")).filter(Boolean)),
  ];
}

function requireSourceIdentity(id: string, title: string): { id: string; title: string } {
  const normalizedId = id.trim();
  const normalizedTitle = title.trim();

  if (!normalizedId) throw new Error("추천 문서의 원본 ID가 필요합니다.");
  if (!normalizedTitle) throw new Error("추천 문서의 제목이 필요합니다.");

  return { id: normalizedId, title: normalizedTitle };
}

function appendTextLine(lines: string[], label: string, value: string | null | undefined) {
  const normalized = normalizeOptionalText(value);
  if (normalized) lines.push(`${label}: ${normalized}`);
}

function appendListLine(lines: string[], label: string, values: string[]) {
  if (values.length > 0) lines.push(`${label}: ${values.join(", ")}`);
}

export function buildRecipeRecommendationDocument(
  source: RecommendationRecipeDocumentSource
): RecommendationDocument {
  const identity = requireSourceIdentity(source.id, source.title);
  const summary = normalizeOptionalText(source.summary);
  const chefTip = normalizeOptionalText(source.chef_tip);
  const category = normalizeOptionalText(source.category);
  const difficulty = normalizeOptionalText(source.difficulty);
  const tags = normalizeSearchList(source.tags);
  const tools = normalizeSearchList(source.tools);
  const ingredients = toArrayIngredient(source.ingredients);
  const ingredientLabels = normalizeSearchList(ingredients.map((ingredient) => ingredient.name));
  const ingredientNames = normalizeExactNames(ingredientLabels);
  const steps = toArrayRecipeSteps(source.steps).map((step) => step.description);
  const lines: string[] = [];

  // 검색 문서에는 요리를 서로 구별하는 내용만 담는다. 모든 문서에 공통으로 붙는 줄(유형 표시,
  // 개수, 예/아니오)과 수량·난이도·시간·인분은 문서끼리 비슷하게 만들어 유사도의 구별력을 떨어뜨린다.
  // 난이도·시간·도구 필요 여부는 아래 필드로 따로 저장해 검색 필터가 쓴다.
  appendTextLine(lines, "제목", identity.title);
  appendTextLine(lines, "설명", summary);
  appendTextLine(lines, "카테고리", category);
  appendListLine(lines, "태그", tags);
  appendListLine(lines, "재료", ingredientLabels);
  appendListLine(lines, "조리 도구", tools);
  appendTextLine(lines, "조리 순서", steps.join(" "));
  appendTextLine(lines, "팁", chefTip);

  return {
    sourceType: "recipe",
    sourceId: identity.id,
    title: identity.title,
    searchText: lines.join("\n"),
    category,
    difficulty,
    timeMinutes: source.time_minutes,
    toolsRequired: source.tools_required,
    ingredientNames,
  };
}

export function buildComboRecommendationDocument(
  source: RecommendationComboDocumentSource
): RecommendationDocument {
  const identity = requireSourceIdentity(source.id, source.title);
  const summary = normalizeOptionalText(source.summary);
  const difficulty = normalizeOptionalText(source.difficulty);
  const tags = normalizeSearchList(source.tags);
  const tools = normalizeSearchList(source.tools);
  const items = toArrayItems(source.items);
  const itemDescriptions = items
    .map((item) => {
      if (item.type === "product") {
        return [item.productName, item.summary].filter(Boolean).join(" - ");
      }
      return [item.title, item.summary].filter(Boolean).join(" - ");
    })
    .filter(Boolean);
  const ingredientNames = normalizeExactNames(
    items.map((item) =>
      item.type === "product" ? item.productName : (item.title ?? item.summary ?? "")
    )
  );
  const steps = toArrayComboSteps(source.steps).map((step) => step.description);
  const lines: string[] = [];

  // 레시피 문서와 같은 기준으로 서로 구별되는 내용만 담는다.
  appendTextLine(lines, "제목", identity.title);
  appendTextLine(lines, "설명", summary);
  appendListLine(lines, "태그", tags);
  appendListLine(lines, "구성", itemDescriptions);
  appendListLine(lines, "조리 도구", tools);
  appendTextLine(lines, "준비 순서", steps.join(" "));

  return {
    sourceType: "combo",
    sourceId: identity.id,
    title: identity.title,
    searchText: lines.join("\n"),
    category: null,
    difficulty,
    timeMinutes: source.time_minutes,
    toolsRequired: source.tools_required,
    ingredientNames,
  };
}
