import { describe, expect, test } from "vitest";
import { z } from "zod";
import { modelOutputSchema } from "./structured-output";

describe("모델 출력 스키마", () => {
  test("모델에 보내는 배열 상한만 제거하고 서버에서는 원래 상한을 검증한다", async () => {
    const schema = await modelOutputSchema(
      z.object({ names: z.array(z.string()).max(2), servings: z.number().min(1).max(50) })
    );
    expect(await schema.jsonSchema).toMatchObject({
      properties: {
        names: { type: "array", items: { type: "string" } },
        servings: { type: "number", minimum: 1, maximum: 50 },
      },
    });
    expect(JSON.stringify(await schema.jsonSchema)).not.toContain('"maxItems":2');
    expect(await schema.validate?.({ names: ["A", "B"], servings: 1 })).toEqual({
      success: true,
      value: { names: ["A", "B"], servings: 1 },
    });
    expect(await schema.validate?.({ names: ["A", "B", "C"], servings: 1 })).toMatchObject({
      success: false,
      error: { issues: [{ path: ["names"] }] },
    });
  });
  test("뺀 배열 상한은 중첩 배열까지 설명 문장으로 옮겨 모델에 알린다", async () => {
    const schema = await modelOutputSchema(
      z.object({
        names: z.array(z.string()).max(2),
        steps: z
          .array(z.object({ tools: z.array(z.string()).max(3).describe("사용 도구") }))
          .max(5),
      })
    );
    expect(await schema.jsonSchema).toMatchObject({
      properties: {
        names: { description: "최대 2개" },
        steps: {
          description: "최대 5개",
          items: { properties: { tools: { description: "사용 도구 (최대 3개)" } } },
        },
      },
    });
  });
  test("속성 이름이 maxItems인 필드는 지우지 않는다", async () => {
    const schema = await modelOutputSchema(z.object({ maxItems: z.number() }));
    expect(await schema.jsonSchema).toMatchObject({
      properties: { maxItems: { type: "number" } },
      required: ["maxItems"],
    });
  });
});
