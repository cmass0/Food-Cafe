"use client";

import Image from "next/image";
import * as React from "react";
import { Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/supabase";

type Provider = "google" | "github" | "kakao" | "apple";

type AuthButton = {
  provider: Provider;
  label: string;
  icon?: React.ReactNode;
  imageSrc?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
};

const AUTH_BUTTONS: AuthButton[] = [
  {
    provider: "google",
    label: "Google로 로그인",
    imageSrc: "/brand/auth/web_neutral_sq_SI@4x.png",
  },
  {
    provider: "github",
    label: "GitHub로 로그인",
    icon: <Github className="h-4 w-4" />,
    className: "bg-black text-white hover:bg-black/80 border-transparent",
  },
  {
    provider: "kakao",
    label: "카카오로 로그인",
    imageSrc: "/brand/auth/kakao_login_medium_narrow.png",
  },
];

function getScope(provider: Provider) {
  if (provider === "kakao") {
    return "profile_nickname account_email";
  }
  if (provider === "google") {
    return "profile email";
  }
  return undefined;
}

async function signIn(provider: Provider) {
  const supabase = getBrowserSupabase();
  const scopes = getScope(provider);
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${location.origin}/auth/callback`,
      scopes,
    },
  });
}

export default function AuthButtons({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-2", className)}>
      {AUTH_BUTTONS.map(({ provider, label, icon, variant, imageSrc, className: extraClassName }) => (
        imageSrc ? (
          <button
            key={provider}
            type="button"
            onClick={() => signIn(provider)}
            className="relative flex items-center justify-center"
            aria-label={label}
          >
            <Image src={imageSrc} alt={label} width={312} height={45} className="h-11 w-auto" priority />
          </button>
        ) : (
          <Button
            key={provider}
            variant={variant}
            className={cn("justify-start gap-2", extraClassName)}
            onClick={() => signIn(provider)}
            type="button"
          >
            {icon}
            <span>{label}</span>
          </Button>
        )
      ))}
    </div>
  );
}
