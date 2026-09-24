export type PostBookmarkStatus = {
  bookmarked: boolean;
};

export type PostBookmarkResult = PostBookmarkStatus & {
  bookmarkCount: number;
};
