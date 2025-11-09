
import { z } from "zod";
import { Constants } from "@/types/supabase";


const parentTypeEnum = z.enum(
  [...Constants.public.Enums.comment_parent_type] as ["recipe", "post"]
);

// ?´ë¼?´ì–¸?¸ê? ì§ì ‘ ?…ë ¥?˜ëŠ” ë³¸ë¬¸ ?„ë“œë§?ê²€ì¦?export const commentBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "?´ìš©???…ë ¥?´ì£¼?¸ìš”.")
    .max(1000, "?´ìš©?€ ìµœë? 1000?ì…?ˆë‹¤."),
});

// ?¼ìš°??ì»¨í…?¤íŠ¸(parent)ë¥??µí•´ ?œë²„ê°€ ?•ë³´?˜ëŠ” ê°?ê²€ì¦?export const commentContextSchema = z.object({
  parentType: parentTypeEnum,
  parentId: z.string().uuid({ message: "parentId??UUID ?•ì‹?´ì–´???©ë‹ˆ??" }),
  writerUid: z.string().uuid({ message: "writerUid??UUID ?•ì‹?´ì–´???©ë‹ˆ??" }),
  writerName: z
    .string()
    .trim()
    .min(1, "?‘ì„±???´ë¦„???…ë ¥?´ì£¼?¸ìš”.")
    .max(40, "?‘ì„±???´ë¦„?€ ìµœë? 40?ì…?ˆë‹¤."),
});

// ?œë²„?ì„œ body + contextë¥??©ì³ ìµœì¢… insert payloadë¥?ê²€ì¦í•  ???¬ìš©
export const commentInsertSchema = commentBodySchema.merge(commentContextSchema);

export const commentUpdateSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "?´ìš©???…ë ¥?´ì£¼?¸ìš”.")
      .max(1000, "?´ìš©?€ ìµœë? 1000?ì…?ˆë‹¤.")
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "ìµœì†Œ ??ê°??´ìƒ???„ë“œë¥?ë³´ë‚´ì£¼ì„¸??",
  });

export const commentListOptionsSchema = z.object({
  parentType: parentTypeEnum,
  parentId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
});

