import { z } from "zod";

export const UserCreateSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해 주세요."),
  username: z.string().trim().min(1, "이름을 입력해 주세요.").max(40),
  likerecipe: z.array(z.string()).optional(),
});
export type UserCreateInput = z.infer<typeof UserCreateSchema>;

export const UserUpdateLegacySchema = z.object({
  email: z.string().email().optional(),
  username: z.string().trim().min(1).optional(),
  likerecipe: z.array(z.string()).optional(),
});
export type UserUpdateLegacyInput = z.infer<typeof UserUpdateLegacySchema>;

export const UserUpdateSchema = z.object({
  display_name: z.string().trim().min(1, "이름을 입력해 주세요.").max(40, "이름은 40자 이하만 가능합니다.").optional().nullable(),
  photo_url: z.string().url("올바른 URL을 입력해 주세요.").optional().nullable(),
  email: z.string().email("올바른 이메일 주소를 입력해 주세요.").optional(),
});
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;

