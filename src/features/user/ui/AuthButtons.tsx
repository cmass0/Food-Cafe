"use client";

import Image from "next/image";
import * as React from "react";
import { Github } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/supabase";

type Provider = "google" | "github" | "kakao" | "apple";

type AuthButton = {
  provider: Provider;
  label: string;
  icon?: React.ReactNode;
  imageSrc?: string;
  imageWidth?: number | string;
  imageHeight?: number | string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
};

const AUTH_BUTTONS: AuthButton[] = [
  {
    provider: "google",
    label: "Google로 로그인",
    imageSrc: "/brand/auth/web_neutral_sq_SI@4x.png",
    imageWidth: 192.875,
    imageHeight: 44,
  },
  {
    provider: "github",
    label: "GitHub로 로그인",
    icon: <Github className="h-4 w-4" />,
    className: "bg-black text-white hover:bg-black/80 border-transparent w-[192.875px] h-[44px] justify-center",
  },
  {
    provider: "kakao",
    label: "카카오로 로그인",
    imageSrc: "/brand/auth/kakao_login_medium_narrow.png",
    imageWidth: 192.875,
    imageHeight: 44
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


function useOAuthSignIn() {
  const searchParams = useSearchParams();
  return React.useCallback(async (provider: Provider) => {
    const supabase = getBrowserSupabase();
    const scopes = getScope(provider);
    const next = searchParams?.get("next");
    const url = new URL(location.href);
    if (next && !url.searchParams.get("next")) {
      url.searchParams.set("next", next);
    }
    const redirectTo = url.toString();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, scopes },
    });
  }, [searchParams]);
}

export default function AuthButtons({ className }: { className?: string }) {
  const signIn = useOAuthSignIn();
  return (
    <div className={cn("grid gap-2", className)}>
      {AUTH_BUTTONS.map(({ provider, label, icon, variant, imageSrc, imageWidth, imageHeight, className: extraClassName }) => {
        if (imageSrc) {
          const widthValue =
            imageWidth !== undefined
              ? typeof imageWidth === "number"
                ? `${imageWidth}px`
                : imageWidth
              : undefined;
          const heightValue =
            imageHeight !== undefined
              ? typeof imageHeight === "number"
                ? `${imageHeight}px`
                : imageHeight
              : undefined;

          const buttonStyle: React.CSSProperties = {};
          if (widthValue) buttonStyle.width = widthValue;
          if (heightValue) buttonStyle.height = heightValue;

          return (
            <button
              key={provider}
              type="button"
              onClick={() => signIn(provider)}
              className="relative flex items-center justify-center cursor-pointer"
              aria-label={label}
              style={buttonStyle}
            >
              <Image
                src={imageSrc}
                alt={label}
                width={312}
                height={45}
                className="h-auto w-full"
                style={{ width: "100%", height: "100%" }}
                priority
              />
            </button>
          );
        }

        return (
          <Button
            key={provider}
            variant={variant}
            className={cn("justify-start gap-2 cursor-pointer", extraClassName)}
            onClick={() => signIn(provider)}
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
