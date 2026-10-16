"use client";

import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { type ReactNode } from "react";

type StepListProps = {
  count: number;
  max: number;
  // 단계 하나의 입력칸. 번호와 이동·삭제 버튼은 이 목록이 붙인다.
  renderStep: (index: number) => ReactNode;
  getKey: (index: number) => string;
  onAdd: () => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
};

// 번호가 붙은 조리 순서 목록. 레시피와 조합 작성 화면이 같이 쓴다.
export function StepList({
  count,
  max,
  renderStep,
  getKey,
  onAdd,
  onMove,
  onRemove,
}: StepListProps) {
  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {Array.from({ length: count }, (_, index) => (
          <li key={getKey(index)} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">{renderStep(index)}</div>
            <div className="flex shrink-0 flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${index + 1}단계 위로`}
                title="위로"
                disabled={index === 0}
                className="size-8 text-muted-foreground"
                onClick={() => onMove(index, index - 1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${index + 1}단계 아래로`}
                title="아래로"
                disabled={index === count - 1}
                className="size-8 text-muted-foreground"
                onClick={() => onMove(index, index + 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${index + 1}단계 삭제`}
                title="삭제"
                disabled={count <= 1}
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        disabled={count >= max}
        className="w-full gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
        onClick={onAdd}
      >
        <Plus className="size-4" aria-hidden="true" />
        단계 추가
      </Button>
    </div>
  );
}
