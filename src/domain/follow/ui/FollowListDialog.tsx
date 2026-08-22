"use client";

import { LoaderCircle, UsersRound } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchFollowList } from "@/domain/follow/api";
import type { FollowListItem, FollowListType } from "@/domain/follow/type";

const PAGE_SIZE = 20;

type Props = {
  targetUserId: string;
  type: FollowListType;
  count: number;
};

function profileInitial(displayName: string) {
  return displayName.trim().slice(0, 1).toUpperCase() || "U";
}

export default function FollowListDialog({ targetUserId, type, count }: Props) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<FollowListItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const requestController = React.useRef<AbortController | null>(null);
  const label = type === "followers" ? "팔로워" : "팔로잉";

  const loadPage = React.useCallback(
    async (nextPage: number, replace: boolean) => {
      requestController.current?.abort();
      const controller = new AbortController();
      requestController.current = controller;
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchFollowList(
          targetUserId,
          type,
          nextPage,
          PAGE_SIZE,
          controller.signal
        );
        if (controller.signal.aborted) return;

        setItems((previous) => {
          if (replace) return result.items;
          const knownIds = new Set(previous.map((item) => item.user.id));
          return [...previous, ...result.items.filter((item) => !knownIds.has(item.user.id))];
        });
        setPage(nextPage);
        setHasMore(result.hasMore);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(`[follow] ${type} list failed`, error);
        setErrorMessage("목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [targetUserId, type]
  );

  React.useEffect(() => {
    if (!open) {
      requestController.current?.abort();
      return;
    }

    setItems([]);
    setPage(1);
    setHasMore(false);
    void loadPage(1, true);
    return () => requestController.current?.abort();
  }, [loadPage, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-sm font-medium transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          aria-label={`${label} ${count.toLocaleString("ko-KR")}명 목록 보기`}
        >
          {label} {count.toLocaleString("ko-KR")}
        </button>
      </DialogTrigger>
      <DialogContent className="w-[92vw] gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-zinc-200 px-6 py-5">
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>사용자를 선택하면 해당 프로필로 이동합니다.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] min-h-56 overflow-y-auto px-3 py-3">
          {loading && items.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center text-zinc-500" role="status">
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              목록을 불러오는 중입니다.
            </div>
          ) : errorMessage && items.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => loadPage(1, true)}
              >
                다시 시도
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center text-zinc-500">
              <UsersRound className="h-9 w-9 text-zinc-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">아직 {label} 사용자가 없습니다.</p>
            </div>
          ) : (
            <div className="grid gap-1">
              {items.map((item) => {
                const name = item.user.display_name || "이름 없는 사용자";
                return (
                  <DialogClose key={item.user.id} asChild>
                    <Link
                      href={`/profile/${item.user.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    >
                      <Avatar className="h-11 w-11 border border-zinc-200">
                        {item.user.photo_url ? (
                          <AvatarImage src={item.user.photo_url} alt={`${name} 프로필 이미지`} />
                        ) : null}
                        <AvatarFallback>{profileInitial(name)}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 truncate text-sm font-semibold text-zinc-900">
                        {name}
                      </span>
                    </Link>
                  </DialogClose>
                );
              })}

              {hasMore ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mx-3 mt-3"
                  disabled={loading}
                  onClick={() => loadPage(page + 1, false)}
                >
                  {loading ? "불러오는 중..." : "더 보기"}
                </Button>
              ) : null}
              {errorMessage ? (
                <p className="px-3 py-2 text-center text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
