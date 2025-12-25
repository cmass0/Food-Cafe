"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import SignInSignUpView from "@/features/auth/ui/SignInSignUpView";

function SignInSignUpPageInner() {
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/";

  return <SignInSignUpView next={next} />;
}

export default function SignInSignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignInSignUpPageInner />
    </Suspense>
  );
}
