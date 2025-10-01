import { z } from "zod";

export const UserUpdateSchema = z.object({
  display_name: z
    .string()
    .min(1, "이름을 입력해 주세요.")
    .max(40, "이름은 40자를 넘을 수 없습니다.")
    .optional()
    .nullable(),
  photo_url: z
    .string()
    .url("올바른 URL을 입력해 주세요.")
    .optional()
    .nullable(),
});

export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;


