import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { isAuthSessionMissingError } from "@/lib/auth/errors";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { safePruneAvatarImages, safeRemoveAvatarImages } from "@/lib/storage/server";
import { normalizeStoredImageReference, resolveStorageImageUrl } from "@/lib/storage/paths";

import * as repository from "./repository";
import { UserUpdateSchema, type UserUpdateInput } from "./schema";
import type { ProfileRow, ProfileUpdateDB, UserListOptions, UserListResult } from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function resolveProfileImage(profile: ProfileRow | null): ProfileRow | null {
  return profile
    ? {
        ...profile,
        photo_url: resolveStorageImageUrl(profile.photo_url),
      }
    : null;
}

function buildUpdatePayload(parsed: UserUpdateInput): ProfileUpdateDB {
  const payload: ProfileUpdateDB = {};

  if (parsed.display_name !== undefined) {
    if (parsed.display_name !== null) {
      payload.display_name = parsed.display_name;
    }
  }

  if (parsed.photo_url !== undefined) {
    payload.photo_url = normalizeStoredImageReference(parsed.photo_url);
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
  return resolveProfileImage(await repository.selectProfileById(supabase, user.id));
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

  const profile = await repository.updateProfileRecord(
    supabase,
    user.id,
    buildUpdatePayload(parsed)
  );
  if (parsed.photo_url !== undefined) {
    await safePruneAvatarImages(user.id, profile.photo_url ?? null);
  }
  return resolveProfileImage(profile) as ProfileRow;
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

  const items = rows.map((profile) => resolveProfileImage(profile) as ProfileRow);
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
  return resolveProfileImage(await repository.selectProfileByDisplayName(supabase, name));
}

export async function getUserById(id: string): Promise<ProfileRow | null> {
  const supabase = await getServerSupabase();
  return resolveProfileImage(await repository.selectProfileById(supabase, id));
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

  // Auth 삭제가 실패하면 공개 프로필만 먼저 사라지는 부분 성공 상태가 생기지 않도록 인증 계정을 먼저 지운다.
  // profiles.id는 auth.users(id)를 ON DELETE CASCADE로 참조하므로 프로필은 함께 삭제된다.
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id);
  if (authDeleteError) throw authDeleteError;

  // Storage는 DB와 트랜잭션을 공유하지 않으므로 실패해도 탈퇴를 되돌리지 않고 주기 정리에 맡긴다.
  await safeRemoveAvatarImages(user.id);
}
