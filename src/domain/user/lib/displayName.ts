import type { User } from "@supabase/supabase-js";
// supabase User 객체에서 표시 이름 가져옴
// oauth인증 및 공통으로 사용할 수 있는 이름 필드를 우선적으로 사용
export function deriveDisplayName(user: User | null): string | null {
  if (!user) return null;

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nameCommon = metadata.full_name ?? metadata.name ?? metadata.nickname ?? metadata.user_name;
  if (typeof nameCommon === "string" && nameCommon.trim().length > 0) {
    return nameCommon;
  }

  const identity = (user.identities ?? [])[0];
  const provider = identity?.provider;
  const data = (identity?.identity_data ?? {}) as Record<string, unknown>;

  if (provider === "github") {
    const githubName = (data.user_name || data.name || data.login) as string | undefined;
    if (githubName && githubName.trim().length > 0) return githubName;
  }

  if (provider === "google") {
    const googleName = (data.name || data.full_name) as string | undefined;
    if (googleName && googleName.trim().length > 0) return googleName;
  }

  if (provider === "kakao") {
    const kakaoProps = data.properties as Record<string, unknown> | undefined;
    const kakaoAccount = data.kakao_account as Record<string, unknown> | undefined;
    const kakaoProfile = kakaoAccount?.profile as Record<string, unknown> | undefined;
    const kakaoName = kakaoProps?.nickname ?? kakaoProfile?.nickname;
    if (typeof kakaoName === "string" && kakaoName.trim().length > 0) {
      return kakaoName;
    }
  }

  return user.email ?? null;
}
