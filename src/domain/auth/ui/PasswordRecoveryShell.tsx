import { ArrowLeft, ChefHat, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buildAuthModalPath } from "@/lib/auth/return-to";
import { cn } from "@/lib/utils";

type PasswordRecoveryShellProps = {
  step: "request" | "update";
  title: string;
  description: ReactNode;
  children: ReactNode;
};

export default function PasswordRecoveryShell({
  step,
  title,
  description,
  children,
}: PasswordRecoveryShellProps) {
  return (
    <main className="flex min-h-screen bg-[#fbfcfa] px-5 py-8 text-zinc-950 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-[460px] flex-col">
        <Link
          href="/"
          className="mx-auto flex items-center gap-2 text-xl font-black tracking-tight text-zinc-950"
          aria-label="FoodCafe 홈으로 이동"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#438e4d] text-white">
            <ChefHat className="h-5 w-5" aria-hidden="true" />
          </span>
          FoodCafe
        </Link>

        <section className="my-auto py-12 text-center sm:py-16" aria-labelledby="recovery-title">
          <div className="mb-7 flex items-center justify-center" aria-hidden="true">
            <span
              className={cn(
                "grid h-14 w-14 place-items-center rounded-full border bg-white shadow-sm",
                step === "request"
                  ? "border-[#438e4d]/30 text-[#438e4d]"
                  : "border-zinc-200 text-zinc-400"
              )}
            >
              <Mail className="h-6 w-6" />
            </span>
            <span className="h-px w-8 bg-zinc-300" />
            <span
              className={cn(
                "grid h-14 w-14 place-items-center rounded-full border bg-white shadow-sm",
                step === "update"
                  ? "border-[#438e4d]/30 text-[#438e4d]"
                  : "border-zinc-200 text-zinc-400"
              )}
            >
              <KeyRound className="h-6 w-6" />
            </span>
          </div>

          <h1 id="recovery-title" className="text-2xl font-black tracking-tight sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-[15px]">{description}</p>

          <div className="mt-8 text-left">{children}</div>

          <Link
            href={step === "request" ? buildAuthModalPath("/") : "/auth/recovery"}
            className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition hover:text-[#438e4d]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {step === "request" ? "로그인으로 돌아가기" : "변경 링크 다시 받기"}
          </Link>
        </section>

        <p className="text-center text-xs text-zinc-400">
          {step === "request"
            ? "링크가 도착하지 않으면 스팸 메일함도 확인해 주세요."
            : "다른 서비스에서 사용하지 않는 안전한 비밀번호를 권장해요."}
        </p>
      </div>
    </main>
  );
}
