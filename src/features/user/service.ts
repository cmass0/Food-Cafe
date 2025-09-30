import { UserUpdateSchema } from "./schema";
import * as repo from "./repository";

export async function updateProfile(input: unknown) {
  const patch = UserUpdateSchema.parse(input);
  if (typeof patch.display_name === "string" && !patch.display_name.trim()) {
    throw new Error("이름을 입력하세요.");
  }
  return repo.updateSelf(patch);
}

