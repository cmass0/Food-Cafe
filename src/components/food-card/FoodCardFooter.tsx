import { Eye } from "lucide-react";

import ReactionCount from "@/components/reactions/ReactionCount";
import { cn } from "@/lib/utils";
import { formatKoreanNumber } from "@/lib/format-number";

type FoodCardReactionsProps = {
  likeCount: number | null | undefined;
  liked?: boolean;
  bookmarkCount: number | null | undefined;
  bookmarked?: boolean;
  viewCount: number | null | undefined;
  className?: string;
};

// 좋아요·북마크·조회 수. 아이콘은 테두리만 두고 내가 누른 것만 색을 채운다(ReactionCount 규칙).
export function FoodCardReactions({
  likeCount,
  liked,
  bookmarkCount,
  bookmarked,
  viewCount,
  className,
}: FoodCardReactionsProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-2.5 tabular-nums", className)}>
      <ReactionCount
        kind="like"
        count={likeCount}
        mine={liked}
        className="gap-1"
        iconClassName="h-3.5 w-3.5"
      />
      <ReactionCount
        kind="bookmark"
        count={bookmarkCount}
        mine={bookmarked}
        className="gap-1"
        iconClassName="h-3.5 w-3.5"
      />
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">조회수</span>
        {formatKoreanNumber(viewCount ?? 0)}
      </span>
    </div>
  );
}

type FoodCardFooterProps = FoodCardReactionsProps & {
  writerName: string;
  dateLabel: string;
};

// 목록 카드 맨 아래 줄. 카드 폭이 넉넉할 때만 작성자와 반응 수를 한 줄에 두고, 좁으면 두 줄로 나눈다.
// 화면이 넓어도 4열이면 카드가 좁으므로 화면 폭이 아니라 카드 폭(@container)을 본다.
export default function FoodCardFooter({
  writerName,
  dateLabel,
  className,
  ...reactions
}: FoodCardFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1.5 border-t border-zinc-100 pt-2.5 text-[11px] text-zinc-400 sm:text-xs @min-[15.5rem]:flex-row @min-[15.5rem]:items-center @min-[15.5rem]:justify-between @min-[15.5rem]:gap-3",
        className
      )}
    >
      <p className="flex w-full min-w-0 items-center gap-1 @min-[15.5rem]:w-auto">
        <span className="truncate font-medium text-zinc-600">{writerName}</span>
        <span className="shrink-0" aria-hidden="true">
          ·
        </span>
        <span className="shrink-0">{dateLabel}</span>
      </p>
      <FoodCardReactions {...reactions} />
    </div>
  );
}
