import { z } from "zod";

export const CommentCreateSchema = z.object({
  comment: z.string().min(1),
  writerName: z.string().min(1),
  writerUid: z.string().min(1).optional(),
  type: z.string().min(1), // e.g., 'home', 'detail', etc.
});

export const CommentUpdateSchema = z.object({
  comment: z.string().min(1).optional(),
});

export type CommentCreateDTO = z.infer<typeof CommentCreateSchema>;
export type CommentUpdateDTO = z.infer<typeof CommentUpdateSchema>;

export interface Comment {
  id: string;
  comment: string;
  writerName: string;
  writerUid?: string | null;
  type: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

