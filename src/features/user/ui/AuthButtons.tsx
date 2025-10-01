"use client";

import Image from "next/image";
import * as React from "react";
import { Github, Apple, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/supabase";

type Provider = "google" | "github" | "kakao" | "apple";

type AuthButton = {
  provider: Provider;
  label: string;
  icon?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
};

const AUTH_BUTTONS: AuthButton[] = [
  {
    provider: "google",
    label: "Sign in with Google",
    icon: <Mail className="h-4 w-4" />,
    variant: "outline",
  },
  {
    provider: "github",
    label: "Sign in with GitHub",
    icon: <Github className="h-4 w-4" />,
    variant: "outline",
  },
  {
    provider: "kakao",
    label: "카카오로 로그인",
    imageSrc: "/auth/kakao-login.png",
  },
  {
    provider: "apple",
    label: "Sign in with Apple",
    icon: <Apple className="h-4 w-4" />,
    variant: "outline",
  },
];

function signIn(provider: Provider) {
  const supabase = getBrowserSupabase();
  const next = new URLSearchParams(window.location.search).get("next") ?? "/profile";
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
}

export default function AuthButtons({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-2", className)}>
      {AUTH_BUTTONS.map(({ provider, label, icon, variant, imageSrc }) => {
        const handleClick = () => signIn(provider);

        if (imageSrc) {
          return (
            <button
              key={provider}
              type="button"
              onClick={handleClick}
              className="relative flex items-center justify-center"
              aria-label={label}
            >
              <Image
                src={imageSrc}
                alt={label}
                width={312}
                height={45}
                className="h-11 w-auto"
                priority
              />
            </button>
          );
        }

        return (
          <Button
            key={provider}
            variant={variant}
            className="justify-start gap-2"
            onClick={handleClick}
            type="button"
          >
            {icon}
            <span>{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
