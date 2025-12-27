import { z } from "zod";

export const UserUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "이름을 입력해 주세요.")
    .max(40, "이름은 40자 이하만 가능합니다.")
    .optional()
    .nullable(),
  photo_url: z.string().url("올바른 URL을 입력해 주세요.").optional().nullable(),
  email: z.string().email("올바른 이메일 주소를 입력해 주세요.").optional(),
});
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
