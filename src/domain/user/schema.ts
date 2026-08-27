import { isManagedStoragePath } from "@/lib/storage/paths";
import { z } from "zod";

const profileImageReferenceSchema = z
  .string()
  .trim()
  .min(1, "프로필 이미지를 선택해 주세요.")
  .max(2048, "이미지 경로는 2048자 이하만 가능합니다.")
  .refine((value) => {
    if (isManagedStoragePath(value)) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "올바른 이미지 경로나 URL을 입력해 주세요.");

export const UserUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "이름을 입력해 주세요.")
    .max(40, "이름은 40자 이하만 가능합니다.")
    .optional()
    .nullable(),
  // 새 업로드는 Storage 상대 경로, 기존 외부 프로필 이미지는 URL일 수 있다.
  photo_url: profileImageReferenceSchema.optional().nullable(),
});
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
