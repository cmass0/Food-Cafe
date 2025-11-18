export type CommentDisplayItem = {
  id: string;
  writerName: string;
  writerUid: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
