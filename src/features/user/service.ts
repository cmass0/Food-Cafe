import { UserUpdateSchema } from "./schema";
import * as repo from "./repository";

export async function updateProfile(input: unknown) {
  const patch = UserUpdateSchema.parse(input);
  if (typeof patch.display_name === "string" && !patch.display_name.trim()) {
    throw new Error("이밴을 입력하 주세요.");
  }
  return repo.updateSelf(patch);
}

export async function getUser(params: unknown) {
  // TODO: Supabase 기반 구현으로 교체 예정
  return params;
}

export async function createUser(params: unknown) {
  // TODO: Supabase 기반 구현으로 교체 예정
  return params;
}

export async function removeUsers(params: unknown) {
  // TODO: Supabase 기반 구현으로 교체 예정
  return params;
}