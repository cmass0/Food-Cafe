import type { User } from "@supabase/supabase-js";

// 공개 콘텐츠에 사용할 수 있는 이름만 가져오며 이메일은 대체값으로 사용하지 않는다.
export function derivePublicDisplayName(user: User | null): string | null {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  // 공통 이름 필드 우선 사용
  // full_name = 구글, name = 구글/깃허브, nickname = 카카오, user_name = 기타
  const nameCommon =
    metadata.display_name ??
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

  return null;
}

// 본인 화면에서는 공개 이름이 없을 때 계정 이메일까지 대체 표시로 사용할 수 있다.
export function deriveDisplayName(user: User | null): string | null {
  if (!user) return null;
  return derivePublicDisplayName(user) ?? user.email ?? null;
}
