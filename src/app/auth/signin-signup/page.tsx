"use client";

import { useSearchParams } from "next/navigation";

import SignInSignUpView from "@/features/auth/ui/SignInSignUpView";

export default function SignInSignUpPage() {
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/";

  return <SignInSignUpView next={next} />;
}

