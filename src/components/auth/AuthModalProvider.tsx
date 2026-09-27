"use client";

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

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("auth") !== "login") return;

    const notice = url.searchParams.get("notice");
    openAuthModal({
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
  }, [openAuthModal]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
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
