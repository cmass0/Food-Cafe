"use client";

import * as React from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import SignInSignUpView from "@/features/auth/ui/SignInSignUpView";

type AuthModalOptions = {
  next?: string;
  mode?: "signin" | "signup";
};

type AuthModalContextValue = {
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = React.createContext<AuthModalContextValue | null>(null);

type AuthModalState = {
  open: boolean;
  next: string;
  mode: "signin" | "signup";
};

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthModalState>({
    open: false,
    next: "/",
    mode: "signin",
  });

  const closeAuthModal = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const openAuthModal = React.useCallback((options?: AuthModalOptions) => {
    const currentPath =
     // ssr 시점 error 방지
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search || ""}`
        : "/";
    setState({
      open: true,
      next: options?.next ?? currentPath,
      mode: options?.mode ?? "signin",
    });
  }, []);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <Dialog open={state.open} onOpenChange={(open) => (open ? null : closeAuthModal())}>
        <DialogContent className="w-[92vw] sm:max-w-[400px] p-0">
          {/* Radix 모달링크구조충족용 */}
          <h2 className="sr-only">로그인/ 회원가입</h2>
          <SignInSignUpView
            next={state.next}
            defaultMode={state.mode}
            onAuthSuccess={closeAuthModal}
          />
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = React.useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within <AuthModalProvider>");
  }
  return ctx;
}
