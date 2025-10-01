"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import AuthButtons from "@/features/user/ui/AuthButtons";
import { getBrowserSupabase } from "@/lib/supabase";

const NAV_ITEMS: Array<{ key: "signin" | "signup"; label: string }> = [
  { key: "signin", label: "로그인" },
  { key: "signup", label: "회원가입" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/profile";

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");

  // signin state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [signInError, setSignInError] = React.useState<string | null>(null);
  const [isSigningIn, startSignInTransition] = React.useTransition();

  // signup state
  const [displayName, setDisplayName] = React.useState("");
  const [signUpEmail, setSignUpEmail] = React.useState("");
  const [signUpPassword, setSignUpPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [signUpMessage, setSignUpMessage] = React.useState<string | null>(null);
  const [signUpError, setSignUpError] = React.useState<string | null>(null);
  const [isSigningUp, startSignUpTransition] = React.useTransition();

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignInError(null);

    if (!email || !password) {
      setSignInError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    startSignInTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setSignInError(error.message);
        return;
      }
      router.replace(next);
    });
  };

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignUpError(null);
    setSignUpMessage(null);

    if (!displayName.trim()) {
      setSignUpError("닉네임을 입력해주세요.");
      return;
    }
    if (!signUpEmail || !signUpPassword) {
      setSignUpError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setSignUpError("비밀번호가 일치하지 않습니다.");
      return;
    }

    startSignUpTransition(async () => {
      const supabase = getBrowserSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (error) {
        setSignUpError(error.message);
        return;
      }

      const user = data.user;
      if (user) {
        const profilePayload = {
          id: user.id,
          display_name: displayName.trim(),
          email: user.email,
          photo_url: user.user_metadata?.picture ?? null,
          is_admin: false,
        };
        const { error: profileError } = await supabase
          .from("users")
          .upsert(profilePayload, { onConflict: "id" });

        if (profileError) {
          setSignUpError(profileError.message);
          return;
        }
      }

      if (data.session) {
        router.replace(next);
      } else {
        setSignUpMessage("확인 메일을 전송했습니다. 이메일을 확인해주세요.");
        setMode("signin");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl font-semibold text-primary">Food Cafe</CardTitle>
          <CardDescription className="text-muted-foreground">
            이메일로 로그인하거나, 새로운 계정을 만들어 커뮤니티에 참여해 보세요.
          </CardDescription>
          <div className="flex gap-2">
            {NAV_ITEMS.map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                variant={mode === key ? "default" : "outline"}
                onClick={() => setMode(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {mode === "signin" ? (
            <form className="grid gap-4" onSubmit={handleSignIn}>
              <div className="grid gap-2">
                <Label htmlFor="signin-email">이메일</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={isSigningIn}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signin-password">비밀번호</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  disabled={isSigningIn}
                />
              </div>
              {signInError ? (
                <p className="text-sm font-medium text-destructive">{signInError}</p>
              ) : null}
              <Button className="w-full" type="submit" disabled={isSigningIn}>
                {isSigningIn ? "로그인 중..." : "이메일로 로그인"}
              </Button>
              <div className="flex justify-end text-sm text-muted-foreground">
                <Link href="/reset-password" className="hover:underline">
                  비밀번호 찾기
                </Link>
              </div>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={handleSignUp}>
              <div className="grid gap-2">
                <Label htmlFor="signup-display-name">닉네임</Label>
                <Input
                  id="signup-display-name"
                  placeholder="표시할 이름"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  disabled={isSigningUp}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-email">이메일</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="example@domain.com"
                  value={signUpEmail}
                  onChange={(event) => setSignUpEmail(event.target.value)}
                  autoComplete="email"
                  disabled={isSigningUp}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-password">비밀번호</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="비밀번호"
                  value={signUpPassword}
                  onChange={(event) => setSignUpPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={isSigningUp}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-password-confirm">비밀번호 확인</Label>
                <Input
                  id="signup-password-confirm"
                  type="password"
                  placeholder="비밀번호 확인"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={isSigningUp}
                />
              </div>
              {signUpError ? (
                <p className="text-sm font-medium text-destructive">{signUpError}</p>
              ) : null}
              {signUpMessage ? <p className="text-sm text-green-600">{signUpMessage}</p> : null}
              <Button className="w-full" type="submit" disabled={isSigningUp}>
                {isSigningUp ? "가입 중..." : "회원가입"}
              </Button>
            </form>
          )}

          <Separator className="my-6" />
          <div className="grid gap-3">
            <p className="text-sm font-medium text-muted-foreground">소셜 계정으로 로그인</p>
            <AuthButtons />
            <Button variant="outline" className="w-full h-11 justify-start gap-2 px-4 leading-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor" />
              </svg>
              <span className="whitespace-nowrap">Login with GitHub</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground/80">
          <div>Food Cafe 커뮤니티 서비스는 Supabase Auth를 통해 안전하게 운영됩니다.</div>
          <div>
            {mode === "signin" ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "회원가입" : "로그인"}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
