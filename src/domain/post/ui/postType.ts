const POST_TYPE_LABELS: Record<string, string> = {
  board: "자유게시판",
  free: "자유게시판",
  "자유": "자유게시판",
  question: "질문&답변",
  qna: "질문&답변",
  "질문": "질문&답변",
  info: "정보공유",
  "정보": "정보공유",
  review: "후기게시판",
  "후기": "후기게시판",
};

export function getPostBoardLabel(type: string | null | undefined): string {
  const normalized = type?.trim() ?? "";
  return (POST_TYPE_LABELS[normalized] ?? POST_TYPE_LABELS[normalized.toLowerCase()] ?? normalized) || "게시판";
}
