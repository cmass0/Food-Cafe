import type { User } from "@supabase/supabase-js";

/**
 * Derive a human-friendly display name from a Supabase auth user.
 * Falls back through metadata, identity provider payloads, then email.
 */
export function deriveDisplayName(user: User | null): string | null {
  if (!user) return null;

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nameCommon =
    metadata.full_name ??
    metadata.name ??
    metadata.nickname ??
    metadata.user_name;
  if (typeof nameCommon === "string" && nameCommon.trim().length > 0) {
    return nameCommon;
  }

  const identity = (user.identities ?? [])[0];
  const provider = identity?.provider;
  const data = (identity?.identity_data ?? {}) as Record<string, unknown>;

  if (provider === "github") {
    const githubName = (data.user_name ||
      data.name ||
      data.login) as string | undefined;
    if (githubName && githubName.trim().length > 0) return githubName;
  }

  if (provider === "google") {
    const googleName = (data.name || data.full_name) as string | undefined;
    if (googleName && googleName.trim().length > 0) return googleName;
  }

  if (provider === "kakao") {
    const kakaoProps = data.properties as
      | Record<string, unknown>
      | undefined;
    const kakaoAccount = data.kakao_account as
      | Record<string, unknown>
      | undefined;
    const kakaoProfile = kakaoAccount?.profile as
      | Record<string, unknown>
      | undefined;
    const kakaoName = kakaoProps?.nickname ?? kakaoProfile?.nickname;
    if (typeof kakaoName === "string" && kakaoName.trim().length > 0) {
      return kakaoName;
    }
  }

  return user.email ?? null;
}
