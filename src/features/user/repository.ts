import type { FetchUsersParams, UserRow, UserSupabaseClient, UserUpdateDB } from "./types";



function mapRows(rows: UserRow[] | null | undefined): UserRow[] {
  return Array.isArray(rows) ? (rows as UserRow[]) : [];
}

export type FetchUsersResult = {
  items: UserRow[];
  total: number;
};

export async function fetchUsers(
  client: UserSupabaseClient,
  params: FetchUsersParams,
): Promise<FetchUsersResult> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;
  let query = (client as any)
    .from("users_public")
    .select("id, display_name, photo_url, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));
 
  if (params.username) {
    const escaped = params.username.replace(/[%_]/g, m => `\\${m}`);
    query = query.ilike("display_name",`%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    items: mapRows(data),
    total: count ?? 0,
  };
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
