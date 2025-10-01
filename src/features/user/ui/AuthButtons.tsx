"use client";

import * as React from "react";
import { Github, Apple, MessageCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/supabase";

type Provider = "google" | "github" | "kakao" | "apple";

type AuthButton = {
  provider: Provider;
  label: string;
  icon: React.ReactNode;
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
    label: "Sign in with Kakao",
    icon: <MessageCircle className="h-4 w-4" />,
    variant: "outline",
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
      {AUTH_BUTTONS.map(({ provider, label, icon, variant }) => (
        <Button
          key={provider}
          variant={variant}
          className="justify-start gap-2"
          onClick={() => signIn(provider)}
          type="button"
        >
          {icon}
          <span>{label}</span>
        </Button>
      ))}
    </div>
  );
}