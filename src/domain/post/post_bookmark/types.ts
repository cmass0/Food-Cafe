export type PostBookmarkStatus = {
  bookmarked: boolean;
};

export type TogglePostBookmark = PostBookmarkStatus & {
  bookmarkCount: number;
};
