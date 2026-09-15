import { describe, expect, test } from "vitest";

import type { TrendingContentItem } from "./types";
import { sortTrendingItems } from "./service";

function createItem(
  id: string,
  trendScore: number,
  recentParticipantCount: number,
  recentBookmarkCount: number
): TrendingContentItem {
  return {
    resourceType: "recipe",
    id,
    title: id,
    summary: null,
    image: null,
    tags: [],
    likeCount: 0,
    bookmarkCount: 0,
    commentCount: 0,
    viewCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    writerUid: null,
    writerName: null,
    recentLikeCount: 0,
    recentBookmarkCount,
    recentCommentCount: 0,
    recentParticipantCount,
    recentActivityCount: 0,
    trendScore,
    lastActivityAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("트렌딩 콘텐츠 정렬", () => {
  test("점수, 고유 참여자, 북마크, ID 순서로 동점을 해소한다", () => {
    const items = [
      createItem("d", 9, 100, 100),
      createItem("c", 10, 2, 10),
      createItem("b", 10, 3, 1),
      createItem("a", 10, 3, 1),
    ];

    expect(sortTrendingItems(items).map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
  });

  test("정렬한 뒤에도 원본 배열 순서를 보존한다", () => {
    const items = [createItem("b", 1, 0, 0), createItem("a", 2, 0, 0)];

    expect(sortTrendingItems(items).map((item) => item.id)).toEqual(["a", "b"]);
    expect(items.map((item) => item.id)).toEqual(["b", "a"]);
  });

  test("빈 목록은 빈 목록으로 반환한다", () => {
    expect(sortTrendingItems([])).toEqual([]);
  });
});
