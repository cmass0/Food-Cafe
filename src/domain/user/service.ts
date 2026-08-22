import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { isAuthSessionMissingError } from "@/lib/auth/errors";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

import * as repository from "./repository";
import { UserUpdateSchema, type UserUpdateInput } from "./schema";
import type { ProfileRow, ProfileUpdateDB, UserListOptions, UserListResult } from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function buildUpdatePayload(parsed: UserUpdateInput): ProfileUpdateDB {
  const payload: ProfileUpdateDB = {};

  if (parsed.display_name !== undefined) {
    if (parsed.display_name !== null) {
      payload.display_name = parsed.display_name;
    }
  }

  if (parsed.photo_url !== undefined) {
    payload.photo_url = parsed.photo_url ?? null;
  }
  return payload;
}

export async function getSelf(): Promise<ProfileRow | null> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (isAuthSessionMissingError(error)) return null;
  if (error) throw error;
  if (!user) return null;
  return repository.selectProfileById(supabase, user.id);
}

export async function updateSelf(input: unknown): Promise<ProfileRow> {
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

  return repository.updateProfileRecord(supabase, user.id, buildUpdatePayload(parsed));
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

export async function findUserByDisplayName(name: string): Promise<ProfileRow | null> {
  const supabase = await getServerSupabase();
  return repository.selectProfileByDisplayName(supabase, name);
}

export async function getUserById(id: string): Promise<ProfileRow | null> {
  const supabase = await getServerSupabase();
  return repository.selectProfileById(supabase, id);
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

  // 1. 인증 계정을 지우기 전에 관리자 권한으로 앱 데이터와 이미지를 정리한다.
  await repository.deleteProfileRecord(admin, user.id);
  await repository.deleteUserAvatar(admin, user.id);

  // 2. Supabase Auth 계정 삭제 — service role 필요
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id);
  if (authDeleteError) throw authDeleteError;
}
