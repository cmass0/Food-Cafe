"use client";

import CommentThread from "./CommentThread.client";

type PostCommentsProps = {
  postId: string;
  pageSize?: number;
  defaultWriterName?: string;
};

export default function PostComments({
  postId,
  pageSize,
  defaultWriterName,
}: PostCommentsProps) {
  return (
    <CommentThread
      parentType="post"
      parentId={postId}
      pageSize={pageSize}
      defaultWriterName={defaultWriterName}
    />
  );
}
