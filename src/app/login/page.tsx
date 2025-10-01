"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import AuthButtons from "@/features/user/ui/AuthButtons";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [keepSignedIn, setKeepSignedIn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setError("이메일/비밀번호 로그인이 준비 중입니다. 소셜 로그인을 이용해주세요.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[420px_1fr]">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-semibold text-primary">Food Cafe</CardTitle>
            <CardDescription className="text-base">
              1111111111111111111111111111111
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 font-medium text-muted-foreground">
                  <Checkbox
                    checked={keepSignedIn}
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                      setKeepSignedIn(checked === true)
                    }
                    id="keepSignedIn"
                  />
                  <span>로그인 상태 유지</span>
                </label>
                <Link href="/reset-password" className="text-sm text-primary hover:underline">
                  비밀번호 찾기
                </Link>
              </div>
              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
              <Button className="w-full" type="submit">
                이메일로 로그인
              </Button>
            </form>
            <Separator className="my-6" />
            <div className="grid gap-3">
              <p className="text-sm font-medium text-muted-foreground">소셜 계정으로 로그인하기</p>
              <AuthButtons />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
            <div>Food Cafe와 함께 다양한 레시피로 커뮤니티 활동을 즐겨보세요.</div>
            <div className="text-xs text-muted-foreground/80">
              이메일 로그인의 처리는 Supabase Auth를 통해 안전하게 이루어집니다.
            </div>
          </CardFooter>
        </Card>

        <Card className="hidden h-full flex-col justify-between bg-primary text-primary-foreground p-10 shadow-lg md:flex">
          <div className="space-y-4">
            <CardTitle className="text-3xl">Food Cafe에 오신 걸 환영합니다!</CardTitle>
            <CardDescription className="text-base text-primary-foreground/90">
              맛있는 레시피를 공유하고, 다른 사용자들의 아이디어를 참고해 보세요.
            </CardDescription>
          </div>
          <div className="space-y-4 text-sm text-primary-foreground/80">
            <p>- 즐겨찾는 레시피를 저장하고 언제든지 다시 확인할 수 있어요.</p>
            <p>- 실시간 인기 메뉴와 주간 커뮤니티 추천을 만나보세요.</p>
            <p>- 로그인 관련 문의는 support@foodcafe.com 으로 연락해주세요.</p>
          </div>
          <div>
            <p className="text-xs text-primary-foreground/60">
              Food Cafe는 사용자 데이터를 소중히 다루며, 인증은 Supabase 서비스를 사용합니다.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
