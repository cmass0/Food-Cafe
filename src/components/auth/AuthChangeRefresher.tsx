"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useAuthModal } from "./AuthModalProvider";
import { useAuth } from "./AuthProvider";

const SIGNED_OUT_NOTICE = "로그인이 만료되어 로그아웃되었습니다.";

// 페이지 이동 없이 로그인 사용자가 바뀌면(자동 로그아웃, 세션 만료, 모달 로그인) 서버에서 그린 화면을 다시 받는다.
// 좋아요·북마크처럼 사용자마다 다른 값이 이전 사용자 기준으로 남지 않게 한다.
// 상단 메뉴의 로그아웃은 서버에서 처리한 뒤 홈으로 이동하므로 여기까지 오지 않는다.
export function AuthChangeRefresher() {
  const router = useRouter();
  const { user, status } = useAuth();
  const { openAuthModal } = useAuthModal();
  const userId = user?.id ?? null;
  // undefined는 아직 로그인 여부를 확인하지 못한 상태다. 첫 확인은 변경으로 보지 않는다.
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;
    const before = previousUserId.current;
    previousUserId.current = userId;
    // 토큰 갱신처럼 같은 사용자로 다시 알려 오는 경우는 새로 받지 않는다.
    if (before === undefined || before === userId) return;

    router.refresh();
    if (before && !userId) {
      toast(SIGNED_OUT_NOTICE, {
        duration: 10_000,
        action: {
          label: "다시 로그인",
          onClick: () => openAuthModal(),
        },
      });
    }
  }, [openAuthModal, router, status, userId]);

  return null;
}
