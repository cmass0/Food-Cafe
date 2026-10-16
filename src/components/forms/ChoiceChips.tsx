"use client";

import { type ComponentProps, type Ref } from "react";
import { cn } from "@/lib/utils";

type ChoiceChipsProps = Omit<ComponentProps<"div">, "onChange"> & {
  options: readonly string[];
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  // 고른 칩을 다시 누르면 선택을 풀고 빈 문자열을 넘긴다.
  allowDeselect?: boolean;
  // 오류가 있을 때 폼이 첫 칩으로 초점을 옮길 수 있게 한다.
  firstChipRef?: Ref<HTMLButtonElement>;
  onChipBlur?: () => void;
};

// 몇 가지 중 하나를 고르는 칸. 드롭다운보다 선택지가 한눈에 보인다.
export function ChoiceChips({
  options,
  value,
  onValueChange,
  allowDeselect = false,
  firstChipRef,
  onChipBlur,
  className,
  ...props
}: ChoiceChipsProps) {
  return (
    <div role="group" className={cn("flex flex-wrap gap-2", className)} {...props}>
      {options.map((option, index) => {
        const selected = value === option;
        return (
          <button
            key={option}
            ref={index === 0 ? firstChipRef : undefined}
            type="button"
            aria-pressed={selected}
            onBlur={onChipBlur}
            onClick={() => onValueChange(selected && allowDeselect ? "" : option)}
            className={cn(
              "h-9 rounded-full border px-3.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-green-500/30 disabled:pointer-events-none disabled:opacity-50",
              selected
                ? "border-green-600 bg-green-600 font-medium text-white"
                : "border-border bg-background hover:border-green-300 hover:bg-green-50 dark:hover:border-green-800 dark:hover:bg-green-950/30"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

// 쉼표로 적은 태그·도구를 칩으로 미리 보여준다.
export function ChipPreview({ items, prefix = "" }: { items: string[]; prefix?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="rounded-full bg-muted px-2.5 py-1 text-xs">
          {prefix}
          {item}
        </li>
      ))}
    </ul>
  );
}
