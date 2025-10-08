import { z } from "zod";

// 생성(레거시 호환) 스키마: Firebase 시절 구조 유지
export const UserCreateSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  username: z.string().min(1),
  likerecipe: z.array(z.string()).optional(),
});
export type UserCreateInput = z.infer<typeof UserCreateSchema>;

export const UserUpdateLegacySchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  likerecipe: z.array(z.string()).optional(),
});
export type UserUpdateLegacyInput = z.infer<typeof UserUpdateLegacySchema>;

// 프로필 수정 스키마: Supabase users 컬럼에 맞춤
export const UserUpdateSchema = z.object({
  display_name: z
    .string()
    .min(1, "이름을 입력해 주세요.")
    .max(40, "이름은 40자까지 가능합니다.")
    .optional()
    .nullable(),
  photo_url: z
    .string()
    .url("올바른 URL 형식이 아닙니다.")
    .optional()
    .nullable(),
});
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;