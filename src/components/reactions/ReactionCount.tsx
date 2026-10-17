import { Bookmark, Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatKoreanNumber } from "@/lib/format-number";

// 목록 카드의 좋아요·북마크 수. 기본은 테두리만 있는 아이콘이고, 내가 누른 것만 색을 채운다.
const KINDS = {
  like: { label: "좋아요", Icon: Heart, mineClassName: "fill-red-400 text-red-400" },
  bookmark: { label: "북마크", Icon: Bookmark, mineClassName: "fill-amber-400 text-amber-400" },
} as const;

type Props = {
  kind: keyof typeof KINDS;
  count: number | null | undefined;
  mine?: boolean;
  className?: string;
  iconClassName?: string;
};

export default function ReactionCount({
  kind,
  count,
  mine = false,
  className,
  iconClassName = "h-4 w-4",
}: Props) {
  const { label, Icon, mineClassName } = KINDS[kind];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className={cn(iconClassName, mine && mineClassName)} aria-hidden="true" />
      <span className="sr-only">{mine ? `${label}(내가 누름)` : label}</span>
      {formatKoreanNumber(count ?? 0)}
    </span>
  );
}
