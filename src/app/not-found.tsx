import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <FileQuestion
          className="size-14 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-5 text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
          주소가 잘못되었거나 페이지가 이동 또는 삭제되었을 수 있습니다.
        </p>
        <Button asChild size="lg" className="mt-8 gap-2">
          <Link href="/">
            <Home className="size-4" aria-hidden="true" />
            홈으로 이동
          </Link>
        </Button>
      </div>
    </main>
  );
}
