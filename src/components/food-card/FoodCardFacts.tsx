import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type FoodCardFactsProps = {
  // 맨 앞에 둘 항목. 레시피는 카테고리 링크, 조합은 구성 개수.
  lead?: ReactNode;
  timeMinutes?: number | null;
  difficulty?: string | null;
  className?: string;
};

// 레시피·조합 목록 카드 제목 위의 한 줄 정보. 사진 위에 배지를 얹지 않고 글자로 정리한다.
export default function FoodCardFacts({
  lead,
  timeMinutes,
  difficulty,
  className,
}: FoodCardFactsProps) {
  const facts = [
    lead,
    timeMinutes ? <span className="tabular-nums">{timeMinutes}분</span> : null,
    difficulty || null,
  ].filter(Boolean);
  if (!facts.length) return null;

  return (
    <p className={cn("flex min-w-0 items-center gap-1.5 text-xs text-zinc-500", className)}>
      {facts.map((fact, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <>
              <span className="h-2.5 w-px shrink-0 bg-zinc-300" aria-hidden="true" />
              <span className="sr-only">, </span>
            </>
          ) : null}
          {/* 카드가 좁으면 맨 앞(카테고리 등)만 줄이고 시간·난이도는 다 보여준다. */}
          <span className={index === 0 && lead ? "min-w-0 truncate" : "shrink-0"}>{fact}</span>
        </Fragment>
      ))}
    </p>
  );
}
