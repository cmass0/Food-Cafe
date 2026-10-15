import { jsonSchema, zodSchema } from "ai";
import type { z } from "zod";

// 배열 상한(maxItems)을 규격에서 빼고, 같은 숫자를 설명 문장으로 옮긴다.
// 속성 이름이 maxItems인 필드는 값이 숫자가 아니라 객체이므로 건드리지 않는다.
function moveMaxItemsToDescription(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(moveMaxItemsToDescription);
  if (node === null || typeof node !== "object") return node;
  const result: Record<string, unknown> = Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, moveMaxItemsToDescription(value)])
  );
  const max = result.maxItems;
  if (typeof max !== "number") return result;
  delete result.maxItems;
  const hint = `최대 ${max}개`;
  result.description =
    typeof result.description === "string" ? `${result.description} (${hint})` : hint;
  return result;
}

export async function modelOutputSchema<T>(schema: z.ZodType<T>) {
  const original = await zodSchema(schema).jsonSchema;
  // Gemini는 중첩 배열의 maxItems가 큰 스키마를 400으로 거절할 수 있다.
  // 전송 규격에서는 배열 상한을 설명으로만 알리고, 응답은 원본 Zod로 다시 검증한다.
  const compatible = moveMaxItemsToDescription(original) as Parameters<typeof jsonSchema<T>>[0];
  return jsonSchema<T>(compatible, {
    validate: (value) => {
      const result = schema.safeParse(value);
      return result.success
        ? { success: true, value: result.data }
        : { success: false, error: result.error };
    },
  });
}
