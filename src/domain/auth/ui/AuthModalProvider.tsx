"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SignInSignUpView from "@/domain/auth/ui/SignInSignUpView";
import { AUTH_REQUIRED_EVENT } from "@/lib/api/client";
import { normalizeReturnTo } from "@/lib/auth/return-to";

type AuthModalOptions = {
  next?: string;
  mode?: "signin" | "signup";
};

type AuthModalContextValue = {
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
};

type AuthModalState = {
  open: boolean;
  next: string;
  mode: "signin" | "signup";
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

    openAuthModal({ next: normalizeReturnTo(url.searchParams.get("next")) });
    url.searchParams.delete("auth");
    url.searchParams.delete("next");
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
          <SignInSignUpView
            key={`${state.mode}:${state.next}`}
            next={state.next}
            defaultMode={state.mode}
            onAuthSuccess={closeAuthModal}
            onNavigateAway={closeAuthModal}
          />
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
