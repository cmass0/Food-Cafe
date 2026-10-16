import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ListPageHeaderProps = {
  title: string;
  description: string;
  // 제목 오른쪽 버튼(작성하기 등)
  action?: ReactNode;
  // 머리말 아래 선에 붙는 탭(카테고리 등). 있으면 아래 여백 대신 탭이 선에 닿는다.
  children?: ReactNode;
};

// 레시피·조합 목록 화면의 머리말. 두 목록이 같은 모양을 쓴다.
export default function ListPageHeader({
  title,
  description,
  action,
  children,
}: ListPageHeaderProps) {
  return (
    <section className="border-b border-zinc-200">
      <div className="mx-auto w-full max-w-7xl px-5 pt-10 md:pt-12 lg:px-8">
        <div
          className={cn(
            "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
            children ? "pb-6" : "pb-8"
          )}
        >
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-zinc-900 md:text-[32px]">
              {title}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">{description}</p>
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}
