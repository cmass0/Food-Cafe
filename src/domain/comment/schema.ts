import { z } from "zod";

import { COMMENT_PARENT_TYPES } from "./types";

const parentTypeEnum = z.enum(COMMENT_PARENT_TYPES);

// 댓글 글자 수 상한. 작성 화면과 DB 제약(comments_content_length)도 이 값을 따른다.
export const COMMENT_MAX_CHARS = 1000;
const commentTooLongMessage = `댓글은 최대 ${COMMENT_MAX_CHARS}자입니다.`;

export const commentBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "댓글을 입력해주세요.")
    .max(COMMENT_MAX_CHARS, commentTooLongMessage),
});

export const commentContextSchema = z.object({
  parentType: parentTypeEnum,
  parentId: z.string().uuid({ message: "parentId는 UUID 형식이어야 합니다." }),
  // writerUid는 서버에서 세션으로 얻고, 작성자 이름은 DB Trigger가 프로필에서 채운다.
  writerUid: z.string().uuid(),
});

export const commentInsertSchema = commentBodySchema.merge(commentContextSchema);

export const commentUpdateSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "댓글을 입력해주세요.")
      .max(COMMENT_MAX_CHARS, commentTooLongMessage)
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "최소 한 개 이상의 필드를 채워야 합니다.",
  });

export const commentListOptionsSchema = z.object({
  parentType: parentTypeEnum,
  parentId: z.string().uuid({ message: "parentId는 UUID 형식이어야 합니다." }),
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
});
