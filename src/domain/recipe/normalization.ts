import { isJson } from "@/lib/domain/service/jsoncheck";
import type { RecipeIngredient, RecipeStep } from "./types";

export function normaliseTextArray(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

export function normaliseImageArray(
  images: string[] | null | undefined,
  fallback?: string | null
): string[] {
  const result = normaliseTextArray(images);
  if (result.length > 0) return result;
  return fallback ? [fallback] : [];
}

export function toArrayIngredient(value: unknown): RecipeIngredient[] {
  if (!Array.isArray(value)) return [];

  const result: RecipeIngredient[] = [];
  for (const item of value) {
    if (!isJson(item)) continue;
    if (!item || typeof item !== "object") continue;

    const name = typeof item.name === "string" ? item.name.trim() : "";
    const amount = typeof item.amount === "string" ? item.amount.trim() : "";
    const unit = typeof item.unit === "string" ? item.unit.trim() : "";
    const unitCustom = typeof item.unitCustom === "string" ? item.unitCustom.trim() : "";

    if (!name && !amount && !unit && !unitCustom) continue;
    result.push({ name, amount, unit, unitCustom });
  }

  return result;
}

export function toArraySteps(value: unknown): RecipeStep[] {
  if (!Array.isArray(value)) return [];

  const result: RecipeStep[] = [];
  for (const item of value) {
    if (!isJson(item)) continue;
    if (!item || typeof item !== "object") continue;

    const step = typeof item.description === "string" ? item.description.trim() : "";
    if (!step) continue;

    result.push({ description: step });
  }

  return result;
}
