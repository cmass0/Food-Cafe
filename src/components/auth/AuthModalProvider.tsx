"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import SignInSignUpView from "@/components/auth/SignInSignUpView";
import Section from "@/components/status/Section";
import { AUTH_REQUIRED_EVENT } from "@/lib/api/client";
import { normalizeReturnTo } from "@/lib/auth/return-to";

type AuthModalOptions = {
  next?: string;
  mode?: "signin" | "signup";
  notice?: "password-reset";
};

type AuthModalContextValue = {
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
};

type AuthModalState = {
  open: boolean;
  next: string;
  mode: "signin" | "signup";
  notice?: "password-reset";
};

const AuthModalContext = React.createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthModalState>({
    open: false,
    next: "/",
    mode: "signin",
  });

  const closeAuthModal = React.useCallback(() => {
    setState((previous) => ({ ...previous, open: false }));
  }, []);

  const openAuthModal = React.useCallback((options?: AuthModalOptions) => {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    setState({
      open: true,
      next: normalizeReturnTo(options?.next ?? currentPath),
      mode: options?.mode ?? "signin",
      notice: options?.notice,
    });
  }, []);

  React.useEffect(() => {
    function handleAuthRequired(event: Event) {
      const detail = (event as CustomEvent<AuthModalOptions>).detail;
      openAuthModal({ next: detail?.next, mode: detail?.mode });
    }

    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
  }, [openAuthModal]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      {/* 검색 매개변수를 읽는 부분만 Suspense로 감싸 레이아웃 전체가 클라이언트 렌더링으로 바뀌지 않게 한다. */}
      <React.Suspense fallback={null}>
        <AuthQueryParamListener onLoginRequested={openAuthModal} />
      </React.Suspense>
      <Dialog open={state.open} onOpenChange={(open) => !open && closeAuthModal()}>
        <DialogContent className="w-[92vw] p-0 sm:max-w-[400px]">
          <DialogTitle className="sr-only">로그인 또는 회원가입</DialogTitle>
          <DialogDescription className="sr-only">
            계속하려면 로그인하거나 새 계정을 만들어 주세요.
          </DialogDescription>
          <Section
            name="auth.modal"
            title="로그인 화면을 표시하지 못했습니다."
            resetKeys={[state.open, state.mode, state.next, state.notice]}
            errorClassName="m-6"
          >
            <SignInSignUpView
              key={`${state.mode}:${state.next}:${state.notice ?? ""}`}
              next={state.next}
              defaultMode={state.mode}
              notice={state.notice}
              onAuthSuccess={closeAuthModal}
              onNavigateAway={closeAuthModal}
            />
          </Section>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = React.useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within <AuthModalProvider>");
  }
  return context;
}

// ?auth=login 주소로 들어오면 로그인 모달을 연다. 처음 불러올 때뿐 아니라 Server Action의 redirect()처럼
// 레이아웃이 유지된 채 주소만 바뀌는 이동에서도 동작하도록 검색 매개변수 변화를 따라간다.
function AuthQueryParamListener({
  onLoginRequested,
}: {
  onLoginRequested: (options?: AuthModalOptions) => void;
}) {
  const searchParams = useSearchParams();

  React.useEffect(() => {
    // searchParams는 주소가 바뀌었을 때 다시 확인하는 계기로만 쓰고, 판단은 실제 주소로 한다.
    // Next 16.3에서는 아래 replaceState로 auth·next를 지운 뒤에도 useSearchParams가 예전 값을 돌려준다.
    // 그 값으로 다시 판단하면 로그인 직후 한 번 더 replaceState("/")를 불러, 로그인 후 돌아갈 주소로 가던 이동이 취소된다.
    const url = new URL(window.location.href);
    if (url.searchParams.get("auth") !== "login") return;

    const notice = url.searchParams.get("notice");
    onLoginRequested({
      next: normalizeReturnTo(url.searchParams.get("next")),
      notice: notice === "password-reset" ? "password-reset" : undefined,
    });
    url.searchParams.delete("auth");
    url.searchParams.delete("next");
    url.searchParams.delete("notice");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }, [searchParams, onLoginRequested]);

  return null;
}
