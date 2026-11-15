import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type FoodCardFactsProps = {
  // 맨 앞에 둘 항목. 레시피는 카테고리 링크, 조합 미리보기는 구성 개수.
  lead?: ReactNode;
  timeMinutes?: number | null;
  difficulty?: string | null;
  className?: string;
};

// 카테고리·조리 시간·난이도를 한 줄로 잇는다. 카테고리 이름에 이미 가운뎃점(샐러드·건강식)이 있어서
// 항목 사이는 점 대신 얇은 세로선으로 나눈다.
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
    <p className={cn("flex min-w-0 items-center gap-2 text-xs text-zinc-500", className)}>
      {facts.map((fact, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <>
              <span className="h-2.5 w-px shrink-0 bg-zinc-200" aria-hidden="true" />
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
