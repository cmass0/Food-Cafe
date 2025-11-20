import { getServerSupabase } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

import { UserCreateSchema, UserUpdateSchema, type UserCreateInput, type UserUpdateInput } from "./schema";
import * as repository from "./repository";
import type {
  UserListOptions,
  UserListResult,
  UserRow,
  UserInsertDB,
  UserUpdateDB,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const ERROR_UNAUTHORIZED = "UNAUTHORIZED";
const ERROR_ALREADY_EXISTS = "USER_ALREADY_EXISTS";
const ERROR_VALIDATION = "VALIDATION_ERROR";

const MESSAGE_LOGIN_REQUIRED = "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
const MESSAGE_DISPLAY_NAME_REQUIRED = "\uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
const MESSAGE_EMAIL_MISMATCH = "\uC694\uCCAD\uD55C \uC774\uBA54\uC77C\uC774 \uC778\uC99D \uACC4\uC815\uACFC \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.";
const MESSAGE_PROFILE_EXISTS = "\uC774\uBBF8 \uC0AC\uC6A9\uC790 \uD504\uB85C\uD544\uC774 \uC874\uC7AC\uD569\uB2C8\uB2E4.";

function withCode<T extends Error>(error: T, code: string): T & { code: string } {
  (error as T & { code: string }).code = code;
  return error as T & { code: string };
}

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  const truncated = Math.trunc(limit);
  if (truncated < 1) return 1;
  if (truncated > MAX_LIMIT) return MAX_LIMIT;
  return truncated;
}

function resolveOffset(page: number | undefined, limit: number): number {
  if (typeof page === "number" && Number.isFinite(page)) {
    const safePage = Math.max(1, Math.trunc(page));
    return (safePage - 1) * limit;
  }
  return 0;
}

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

function pickAvatarURL(user: User): string | null {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const candidates = [metadata.avatar_url, metadata.picture, metadata.avatarUrl];
  const selected = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof selected === "string" ? selected : null;
}

function buildInsertPayload(authUser: User, parsed: UserCreateInput): UserInsertDB {
  const now = new Date().toISOString();
  return {
    id: authUser.id,
    display_name: parsed.username,
    email: parsed.email ?? authUser.email ?? null,
    photo_url: pickAvatarURL(authUser),
    created_at: now,
    updated_at: now,
  };
}

export async function getSelf(): Promise<UserRow | null> {
  const supabase = getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) return null;
  return repository.selectUserById(supabase, user.id);
}


export async function updateSelf(input: unknown): Promise<UserRow> {
  const supabase = getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw withCode(new Error(MESSAGE_LOGIN_REQUIRED), ERROR_UNAUTHORIZED);

  const parsed = UserUpdateSchema.parse(input);
  if (typeof parsed.display_name === "string" && !parsed.display_name.trim()) {
    throw withCode(new Error(MESSAGE_DISPLAY_NAME_REQUIRED), ERROR_VALIDATION);
  }

  if (parsed.email && parsed.email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email: parsed.email });
    if (emailError) throw emailError;
  }

  return repository.updateUserRecord(supabase, user.id, buildUpdatePayload(parsed));
}

export async function listUsers(options?: UserListOptions): Promise<UserListResult> {
  const supabase = getServerSupabase();
  const limit = resolveLimit(options?.limit);
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
  const supabase = getServerSupabase();
  return repository.selectUserByDisplayName(supabase, name);
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const supabase = getServerSupabase();
  return repository.selectUserById(supabase, id);
}

export async function deleteUserById(): Promise<void> {
  const supabase = getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw withCode(new Error(MESSAGE_LOGIN_REQUIRED), ERROR_UNAUTHORIZED);
  await repository.deleteUserRecord(supabase, user.id);
}
