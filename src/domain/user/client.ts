"use client";

import { getUser } from "@/domain/user/api";

// Fetch display name for a given Supabase auth uid via our users API route.
// Returns null if not found or on error.
export async function fetchUsernameByUid(uid: string): Promise<string | null> {
  if (!uid) return null;
  try {
    const payload = await getUser(uid);
    if (!payload) return null;
    const user = (payload as any)?.data;
    return typeof user?.username === "string" ? user.username : null;
  } catch (error) {
    console.error("Failed to fetch username by uid", error);
    return null;
  }
}
