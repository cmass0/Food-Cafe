import { z } from "zod";

export const followTargetSchema = z.string().uuid("유효한 사용자 ID가 아닙니다.");

export const followListQuerySchema = z.object({
  type: z.enum(["followers", "following"]),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
