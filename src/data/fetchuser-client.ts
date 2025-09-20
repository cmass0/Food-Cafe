"use client";

import { getUser } from "@/features/user/api";

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
