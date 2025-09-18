import { z } from "zod";

export const RecipeCreateSchema = z.object({
  title: z.string().min(1).max(100),
  summary: z.string().max(200).nullable().optional(),
  image: z.string().url().nullable().optional(),
  recipe: z.string().min(1),
  writerUid: z.string().min(1).optional(),
  writerName: z.string().min(1),
  writerEmail: z.string().email().optional(),
});

export const RecipeUpdateSchema = RecipeCreateSchema.partial().extend({
  likeCount: z.number().int().min(0).optional(),
  viewCount: z.number().int().min(0).optional(),
  likeCountIncrement: z.boolean().optional(),
  viewCountIncrement: z.boolean().optional(),
  lastLikedAt: z.string().datetime().nullable().optional(),
});

export type RecipeCreateDTO = z.infer<typeof RecipeCreateSchema>;
export type RecipeUpdateDTO = z.infer<typeof RecipeUpdateSchema>;

export interface Recipe {
  id: string;
  title: string;
  summary?: string | null;
  image?: string | null;
  images?: string[];
  recipe: string;
  writerUid?: string | null;
  writerName: string;
  writerEmail?: string | null;
  likeCount: number;
  viewCount: number;
  lastLikedAt?: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

