import { getServerSupabase } from "@/lib/supabase/server";

import { UserCreateSchema, UserUpdateSchema, type UserUpdateInput } from "./schema";
import * as repository from "./repository";
import type { UserCursorFilter, UserListOptions, UserListResult, UserRow, UserUpdateDB } from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

type CursorPayload = {
  created_at?: string;
  id?: string;
};

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  const truncated = Math.trunc(limit);
  if (truncated < 1) return 1;
  if (truncated > MAX_LIMIT) return MAX_LIMIT;
  return truncated;
}

function parseCursor(cursor?: string | null): UserCursorFilter | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as CursorPayload;
    if (!payload.created_at || !payload.id) return null;
    return { createdAt: payload.created_at, id: payload.id };
  } catch {
    return null;
  }
}

function toCursor(row: UserRow): string {
  const payload = JSON.stringify({ created_at: row.created_at, id: row.id });
  return Buffer.from(payload).toString("base64url");
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
  const supabase = getServerSupabase();
  const limit = resolveLimit(options?.limit);
  const rows = await repository.fetchUsers(supabase, {
    limit: limit + 1,
    username: options?.username,
    cursor: parseCursor(options?.cursor),
  });

  const hasExtra = rows.length > limit;
  const items = hasExtra ? rows.slice(0, limit) : rows;
  const cursorRow = hasExtra ? rows[limit] : null;

  return {
    items,
    nextCursor: cursorRow ? toCursor(cursorRow) : null,
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

export async function createUser(input: unknown): Promise<UserRow> {
  const supabase = getServerSupabase();
  const parsed = UserCreateSchema.parse(input);
  return repository.insertUserRecord(supabase, {
    id: parsed.id,
    email: parsed.email,
    display_name: parsed.username,
    photo_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function updateUserById(id: string, input: unknown): Promise<UserRow> {
  const supabase = getServerSupabase();
  const parsed = UserUpdateSchema.parse(input);
  return repository.updateUserRecord(supabase, id, buildUpdatePayload(parsed));
}

export async function deleteUserById(id: string): Promise<void> {
  const supabase = getServerSupabase();
  await repository.deleteUserRecord(supabase, id);
}
