import type { UserRow, UserSupabaseClient } from "./types";

const USER_COLUMNS = [
  "id",
  "display_name",
  "photo_url",
  "role",
  "email",
  "created_at",
  "updated_at",
  "is_admin"
].join(", ");

function mapRows(rows: UserRow[] | null | undefined): UserRow[] {
  return Array.isArray(rows) ? (rows as UserRow[]) : [];
}

export type UserCursorFilter = {
  createdAt: string;
  id: string;
};

export type FetchUsersParams = {
  limit: number;
  username?: string;
  cursor?: UserCursorFilter | null;
};

export async function fetchUsers(
  client: UserSupabaseClient,
  params: FetchUsersParams
): Promise<UserRow[]> {
  const safeLimit = Math.max(params.limit, 1);
  let query = client
    .from("users")
    .select(USER_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(safeLimit);

  if (params.username) {
    query = query.ilike("display_name", params.username);
  }

  if (params.cursor) {
    query = query.or(
      `created_at.lt.${params.cursor.createdAt},and(created_at.eq.${params.cursor.createdAt},id.gt.${params.cursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return mapRows(data as UserRow[]);
}

export async function selectUserById(
  client: UserSupabaseClient,
  id: string
): Promise<UserRow | null> {
  const { data, error } = await client
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as UserRow) ?? null;
}

export async function selectUserByDisplayName(
  client: UserSupabaseClient,
  name: string
): Promise<UserRow | null> {
  const { data, error } = await client
    .from("users")
    .select(USER_COLUMNS)
    .ilike("display_name", name)
    .maybeSingle();
  if (error) throw error;
  return (data as UserRow) ?? null;
}

export async function insertUserRecord(
  client: UserSupabaseClient,
  payload: Record<string, unknown>
): Promise<UserRow> {
  const { data, error } = await client
    .from("users")
    .insert(payload)
    .select(USER_COLUMNS)
    .single();
  if (error) throw error;
  return data as UserRow;
}

export async function updateUserRecord(
  client: UserSupabaseClient,
  id: string,
  payload: Record<string, unknown>
): Promise<UserRow> {
  const { data, error } = await client
    .from("users")
    .update(payload)
    .eq("id", id)
    .select(USER_COLUMNS)
    .single();
  if (error) throw error;
  return data as UserRow;
}

export async function deleteUserRecord(client: UserSupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("users").delete().eq("id", id);
  if (error) throw error;
}
