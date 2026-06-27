import {
  CommentDeleteResponse,
  CommentInsertInput,
  CommentMutationResponse,
} from "./types";

export async function listComments(
  params: { 
    parentType: "recipe" | "post" | "combo";
    parentId: string;
    page?: number;
    limit?: number;
 
  }
) {
  const qs = new URLSearchParams();
  if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
  if (typeof params?.page === "number") qs.set("page", String(params.page));

  if (params?.parentType) qs.set("parentType", params.parentType);
  if (params?.parentId) qs.set("parentId", params.parentId);

  const res = await fetch(`/api/comments${qs.size ? `?${qs.toString()}` : ""}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to list comments: ${res.status}`);
  } 
  const json = await res.json();
  return json.data;
}

export async function getComment(id: string) {
  const res = await fetch(`/api/comments/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to get comment: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

// 응답: { comment, parentCommentCount }
// like/bookmark와 동일하게 "응답에 새 카운트 포함"
export async function createComment(body: CommentInsertInput): Promise<CommentMutationResponse> {
  const res = await fetch(`/api/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Failed to create comment: ${res.status}`);
  }
  const json = await res.json();
  return json.data as CommentMutationResponse;
}

export async function updateComment(id: string, body: unknown) {
  const res = await fetch(`/api/comments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Failed to update comment: ${res.status}`);
  }
  const json = await res.json();
  return json.data;

}

// 응답: { parentType, parentId, parentCommentCount }
export async function deleteComment(id: string): Promise<CommentDeleteResponse> {
  const res = await fetch(`/api/comments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete comment: ${res.status}`);
  }
  const json = await res.json();
  return json.data as CommentDeleteResponse;
}
