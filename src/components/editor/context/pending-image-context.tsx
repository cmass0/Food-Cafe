"use client";

import { createContext, type ReactNode, useContext } from "react";

type RegisterPendingImage = (file: File) => string;

const PendingImageContext = createContext<RegisterPendingImage | null>(null);

export function PendingImageProvider({
  register,
  children,
}: {
  register?: RegisterPendingImage;
  children: ReactNode;
}) {
  return (
    <PendingImageContext.Provider value={register ?? null}>{children}</PendingImageContext.Provider>
  );
}

export function usePendingImageRegistration(): RegisterPendingImage | null {
  return useContext(PendingImageContext);
}
