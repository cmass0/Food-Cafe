import { INVALID_MENTION_MESSAGE, MENTION_LIMIT_MESSAGE } from "./mentions";

/**
 * 사용자에게 그대로 보여줘도 되는 게시글 오류 문구.
 * 이 목록에 없는 오류는 내부 정보가 새지 않도록 기본 안내로 대체된다.
 *
 * 값이 바뀔 수 있는 문구는 문자열을 다시 적지 않고 정의한 곳에서 가져온다.
 */
export const POST_USER_FACING_ERRORS: ReadonlySet<string> = new Set([
  "내용을 입력해 주세요.",
  "본문은 200KB 이하로 작성해 주세요.",
  "유효하지 않은 게시글 형식입니다.",
  "유효하지 않은 형식입니다.",
  "작성자 정보를 확인할 수 없습니다.",
  "이미지 업로드가 완료되지 않았습니다.",
  "팔로잉 중인 사용자만 멘션할 수 있습니다.",
  INVALID_MENTION_MESSAGE,
  MENTION_LIMIT_MESSAGE,
]);
