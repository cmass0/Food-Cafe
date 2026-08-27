import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { FetchUsersParams, ProfileRow, ProfileUpdateDB } from "./types";

const PUBLIC_PROFILE_COLUMNS =
  "id, display_name, photo_url, created_at, updated_at, follower_count, following_count";

function mapRows(rows: ProfileRow[] | null | undefined): ProfileRow[] {
  return Array.isArray(rows) ? rows : [];
}

export type FetchUsersResult = {
  items: ProfileRow[];
  total: number;
};

export async function fetchUsers(
  client: SupabaseClient<Database>,
  params: FetchUsersParams
): Promise<FetchUsersResult> {
  const safeLimit = Math.max(params.limit, 1);
  const safeOffset = Math.max(params.offset, 0);
  const rangeEnd = safeOffset + safeLimit - 1;
  let query = client
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(safeOffset, Math.max(rangeEnd, safeOffset));

  if (params.username) {
    const escaped = params.username.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.ilike("display_name", `%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    items: mapRows(data),
    total: count ?? 0,
  };
}

export async function selectProfileById(
  client: SupabaseClient<Database>,
  id: string
): Promise<ProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function selectProfileByDisplayName(
  client: SupabaseClient<Database>,
  name: string
): Promise<ProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .ilike("display_name", name)
    .maybeSingle(); // 데이터가 존재하지 않을 수 있음
  if (error) throw error;
  return data ?? null;
}

export async function updateProfileRecord(
  client: SupabaseClient<Database>,
  id: string,
  payload: ProfileUpdateDB
): Promise<ProfileRow> {
  const { data, error } = await client
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select(PUBLIC_PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}
