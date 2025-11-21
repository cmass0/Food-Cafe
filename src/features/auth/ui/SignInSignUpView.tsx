"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import AuthButtons from "@/features/user/ui/AuthButtons";
import { getBrowserSupabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { setRemember } from "@/lib/auth/login-maintain";

type SignInSignUpViewProps = {
  next?: string;
  defaultMode?: "signin" | "signup";
  onAuthSuccess?: (nextPath: string) => void;
};

export default function SignInSignUpView({
  next = "/",
  defaultMode = "signin",
  onAuthSuccess,
}: SignInSignUpViewProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"signin" | "signup">(defaultMode);

  // Sign-in state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [signInError, setSignInError] = React.useState<string | null>(null);
  const [isSigningIn, startSignInTransition] = React.useTransition();
  const [maintainLogin, setMaintainLogin] = React.useState(false);

  // Sign-up state
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
    setRemember(maintainLogin);

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
      onAuthSuccess?.(next);
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
      const url = new URL("/auth/callback", location.origin);
      if (next) url.searchParams.set("next", next);

      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          emailRedirectTo: url.toString(),
          data: { display_name: displayName.trim() },
        },
      });

      if (error) {
        setSignUpError(error.message);
        return;
      }

      if (data.session) {
        onAuthSuccess?.(next);
        router.replace(next);
      } else {
        setSignUpMessage("확인 메일이 발송되었습니다. 이메일을 확인해주세요.");
        setMode("signin");
      }
    });
  };

  return (
    <div className="items-center justify-center">
      <Card className="flex h-full max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden shadow-lg">
        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          <ScrollArea type="always" className="h-full">
            <div className="p-6">
              <CardHeader className="items-center space-y-3">
                <CardTitle className="text-3xl font-semibold text-green-600">Food Cafe</CardTitle>
              </CardHeader>

              {signUpMessage ? (
                <div className="mx-6 -mt-2 mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                  {signUpMessage}
                </div>
              ) : null}

              <Tabs value={mode} onValueChange={(value) => setMode(value as "signin" | "signup")} className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-2">
                  <TabsTrigger value="signin">로그인</TabsTrigger>
                  <TabsTrigger value="signup">회원가입</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
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
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Checkbox id="remember" onCheckedChange={(v) => setMaintainLogin(Boolean(v))} />
                        <Label htmlFor="remember">로그인 유지</Label>
                      </div>
                      <Link href="/reset-password" className="hover:underline">
                        비밀번호 찾기
                      </Link>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form className="grid gap-4" onSubmit={handleSignUp}>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-display-name">닉네임</Label>
                      <Input
                        id="signup-display-name"
                        placeholder="사용자 이름"
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
                </TabsContent>
              </Tabs>

              <Separator className="my-4" />
              <div className="grid justify-center gap-3">
                <AuthButtons />
              </div>

              <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted-foreground/80">
                <div>{mode === "signin" ? "계정이 없으신가요? 상단 탭에서 회원가입을 선택하세요." : "이미 계정이 있으신가요? 상단 탭에서 로그인을 선택하세요."}</div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
