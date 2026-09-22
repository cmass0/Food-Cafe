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

export const RECOMMENDATION_DOCUMENT_VERSION = "recommendation-document-v1";

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

function formatIngredient({
  name,
  amount,
  unit,
  unitCustom,
}: ReturnType<typeof toArrayIngredient>[number]): string {
  const resolvedUnit = unit === "custom" ? unitCustom : unit;
  return [name, amount, resolvedUnit]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");
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
  const ingredientNames = normalizeExactNames(ingredients.map((ingredient) => ingredient.name));
  const ingredientDescriptions = ingredients.map(formatIngredient).filter(Boolean);
  const steps = toArrayRecipeSteps(source.steps).map((step) => step.description);
  const lines = [`문서 버전: ${RECOMMENDATION_DOCUMENT_VERSION}`, "콘텐츠 유형: 레시피"];

  appendTextLine(lines, "제목", identity.title);
  appendTextLine(lines, "설명", summary);
  appendTextLine(lines, "카테고리", category);
  appendListLine(lines, "태그", tags);
  appendListLine(lines, "재료", ingredientDescriptions);
  lines.push(`재료 수: ${ingredientNames.length}`);
  appendListLine(lines, "조리 도구", tools);
  lines.push(`특별한 조리 도구 필요: ${source.tools_required ? "예" : "아니오"}`);
  appendTextLine(lines, "난이도", difficulty);
  if (source.time_minutes !== null) lines.push(`조리 시간: ${source.time_minutes}분`);
  if (source.servings !== null) lines.push(`인분: ${source.servings}인분`);
  appendListLine(lines, "조리 순서", steps);
  appendTextLine(lines, "요리 팁", chefTip);

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
  const lines = [`문서 버전: ${RECOMMENDATION_DOCUMENT_VERSION}`, "콘텐츠 유형: 레시피 콤보"];

  appendTextLine(lines, "제목", identity.title);
  appendTextLine(lines, "설명", summary);
  appendListLine(lines, "태그", tags);
  appendListLine(lines, "구성", itemDescriptions);
  lines.push(`구성 수: ${items.length}`);
  appendListLine(lines, "조리 도구", tools);
  lines.push(`특별한 조리 도구 필요: ${source.tools_required ? "예" : "아니오"}`);
  appendTextLine(lines, "난이도", difficulty);
  if (source.time_minutes !== null) lines.push(`준비 시간: ${source.time_minutes}분`);
  appendListLine(lines, "준비 순서", steps);

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
