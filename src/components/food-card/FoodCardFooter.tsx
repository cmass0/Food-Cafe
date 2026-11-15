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

type FoodCardFooterProps = {
  writerName: string;
  likeCount: number | null | undefined;
  liked?: boolean;
  className?: string;
};

// 목록 카드 맨 아래 줄. 작성자와 좋아요 수만 둔다. 작성일·북마크·조회 수는 상세 화면에서 본다.
export default function FoodCardFooter({
  writerName,
  likeCount,
  liked,
  className,
}: FoodCardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 text-xs text-zinc-400 sm:text-[13px]",
        className
      )}
    >
      <span className="min-w-0 truncate text-zinc-500">{writerName}</span>
      <ReactionCount
        kind="like"
        count={likeCount}
        mine={liked}
        className="shrink-0 gap-1 tabular-nums"
        iconClassName="h-3.5 w-3.5"
      />
    </div>
  );
}
