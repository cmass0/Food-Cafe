"use client";

import * as React from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";

type AuthRequiredModalProps = {
  next: string;
};

export default function AuthRequiredModal({ next }: AuthRequiredModalProps) {
  const { openAuthModal } = useAuthModal();

  React.useEffect(() => {
    openAuthModal({ next });
  }, [next, openAuthModal]);

  return null;
}
