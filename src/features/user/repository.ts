import type { FetchUsersParams, UserInsertDB, UserRow, UserSupabaseClient, UserUpdateDB } from "./types";



function mapRows(rows: UserRow[] | null | undefined): UserRow[] {
  return Array.isArray(rows) ? (rows as UserRow[]) : [];
}

export async function fetchUsers(
  client: UserSupabaseClient,
  params: FetchUsersParams,
): Promise<UserRow[]> {
  const safeLimit = Math.max(params.limit, 1);
  let query = (client as any)
    .from("users_public")
    .select("id, display_name, photo_url, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(safeLimit);
 
  if (params.username) {
    const escaped = params.username.replace(/[%_]/g, m => `\\${m}`);
    query = query.ilike("display_name",`%${escaped}%`);
  }

  if (params.cursor) {
    query = query.or(
      `created_at.lt.${params.cursor.createdAt},and(created_at.eq.${params.cursor.createdAt},id.gt.${params.cursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return mapRows(data);
}

export async function selectUserById(
  client: UserSupabaseClient,
  id: string
): Promise<UserRow | null> {
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function selectUserByDisplayName(
  client: UserSupabaseClient,
  name: string
): Promise<UserRow | null> {
  const { data, error } = await client
    .from("users")
    .select("*")
    .ilike("display_name", name)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function insertUserRecord(
  client: UserSupabaseClient,
  payload: UserInsertDB
): Promise<UserRow> {
  const { data, error } = await client
    .from("users")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as UserRow;
}



export async function updateUserRecord(
  client: UserSupabaseClient,
  id: string,
  payload: UserUpdateDB
): Promise<UserRow> {
  const { data, error } = await client
    .from("users")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as UserRow;
}

export async function deleteUserRecord(client: UserSupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("users").delete().eq("id", id);
  if (error) throw error;
}
