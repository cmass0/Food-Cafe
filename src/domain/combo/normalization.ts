import { isJson } from "@/lib/domain/service/jsoncheck";
import { resolveStorageImageUrl } from "@/lib/storage/paths";
import type { ComboItems, ComboSteps } from "./types";

// JSON 형태로 저장된 조리 단계를 화면과 추천 문서에서 공통으로 사용하는 형태로 변환한다.
export function toArraySteps(value: unknown): ComboSteps[] {
  if (!Array.isArray(value)) return [];

  const result: ComboSteps[] = [];
  for (const item of value) {
    if (!isJson(item)) continue;

    const description = typeof item.description === "string" ? item.description.trim() : "";
    if (!description) continue;

    result.push({ description });
  }

  return result;
}

// JSON 형태로 저장된 콤보 아이템을 화면·추천 도메인에서 함께 쓰는 형태로 변환한다.
export function toArrayItems(value: unknown): ComboItems[] {
  if (!Array.isArray(value)) return [];

  const result: ComboItems[] = [];
  for (const item of value) {
    if (!isJson(item)) continue;

    if (item.type === "recipe") {
      const recipeid = typeof item.recipeid === "string" ? item.recipeid.trim() : "";
      const summary = typeof item.summary === "string" ? item.summary.trim() : undefined;
      const image = resolveStorageImageUrl(item.image);
      const title = typeof item.title === "string" ? item.title.trim() : undefined;
      result.push({ type: "recipe", recipeid, summary, image, title });
    }

    if (item.type === "product") {
      const productName = typeof item.productName === "string" ? item.productName.trim() : "";
      const summary = typeof item.summary === "string" ? item.summary.trim() : undefined;
      const image = resolveStorageImageUrl(item.image);
      result.push({ type: "product", productName, summary, image });
    }
  }

  return result;
}
