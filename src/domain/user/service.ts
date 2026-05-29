import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

import * as repository from "./repository";
import { UserUpdateSchema, type UserUpdateInput } from "./schema";
import type { UserListOptions, UserListResult, UserRow, UserUpdateDB } from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function buildUpdatePayload(parsed: UserUpdateInput): UserUpdateDB {
  const payload: UserUpdateDB = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.display_name !== undefined) {
    if (parsed.display_name !== null) {
      payload.display_name = parsed.display_name;
    }
  }

  if (parsed.photo_url !== undefined) {
    payload.photo_url = parsed.photo_url ?? null;
  }
  if (parsed.email !== undefined) {
    payload.email = parsed.email ?? null;
  }

  return payload;
}

export async function getSelf(): Promise<UserRow | null> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("로그인이 필요합니다");
  return repository.selectUserById(supabase, user.id);
}

export async function updateSelf(input: unknown): Promise<UserRow> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("로그인이 필요합니다.");

  const parsed = UserUpdateSchema.parse(input);
  if (typeof parsed.display_name === "string" && !parsed.display_name.trim()) {
    throw new Error("이름을 입력해 주세요.");
  }

  if (parsed.email && parsed.email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email: parsed.email });
    if (emailError) throw emailError;
  }

  return repository.updateUserRecord(supabase, user.id, buildUpdatePayload(parsed));
}

export async function listUsers(options?: UserListOptions): Promise<UserListResult> {
  const supabase = await getServerSupabase();
  const limit = resolveLimit(options?.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(options?.page, limit);
  const { items: rows, total: rawTotal } = await repository.fetchUsers(supabase, {
    limit,
    offset,
    username: options?.username,
  });

  const items = rows;
  const total = Math.max(rawTotal, offset + items.length);
  const hasMore = offset + items.length < total;

  return {
    items,
    total,
    limit,
    offset,
    hasMore,
  };
}

export async function findUserByDisplayName(name: string): Promise<UserRow | null> {
  const supabase = await getServerSupabase();
  return repository.selectUserByDisplayName(supabase, name);
  
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const supabase = await getServerSupabase();
  return repository.selectUserById(supabase, id);
}

export async function deleteUserById(): Promise<void> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("로그인이 필요합니다.");

  const admin = getAdminSupabase();

  // 1. public.users 레코드 삭제
  //    DB FK가 모두 CASCADE로 설정되어 있어 recipes, combos, comments,
  //    likes, bookmarks, follows 등 연관 데이터가 자동으로 함께 삭제됨
  await repository.deleteUserRecord(supabase, user.id);

  // 2. 스토리지에 저장된 프로필 사진 삭제
  await repository.deleteUserAvatar(admin, user.id);

  // 3. Supabase Auth 계정 삭제 — service role 필요
  //    auth를 마지막에 삭제해야 앞 단계에서 세션 권한이 유지됨
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id);
  if (authDeleteError) throw authDeleteError;
}
