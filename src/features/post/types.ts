import { z } from "zod";

export const PostCreateSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1),
  writerName: z.string().min(1),
  writerUid: z.string().min(1).optional(),
  type: z.string().default("board").optional(),
});

export const PostUpdateSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  content: z.string().min(1).optional(),
  writerName: z.string().min(1).optional(),
  writerUid: z.string().min(1).optional(),
  type: z.string().optional(),
  checkIncrement: z.boolean().optional(),
});

export type PostCreateDTO = z.infer<typeof PostCreateSchema>;
export type PostUpdateDTO = z.infer<typeof PostUpdateSchema>;

export interface Post {
  id: string;
  title: string;
  content: string;
  writerName: string;
  writerUid?: string | null;
  number: number;
  check: number;
  type: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

