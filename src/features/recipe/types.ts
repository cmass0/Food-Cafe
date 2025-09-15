import { z } from "zod";

export const RecipeCreateSchema = z.object({
  title: z.string().min(1).max(100),
  summary: z.string().max(200).optional(),
  image: z.string().url().nullable().optional(),
  recipe: z.string().min(1),
  writerUid: z.string().min(1),
  writerName: z.string().min(1),
});

export const RecipeUpdateSchema = RecipeCreateSchema.partial();

export type RecipeCreateDTO = z.infer<typeof RecipeCreateSchema>;
export type RecipeUpdateDTO = z.infer<typeof RecipeUpdateSchema>;

export interface Recipe {
  id: string;
  title: string;
  summary?: string | null;
  image?: string | null;
  recipe: string;
  writerUid: string;
  writerName: string;
  likeCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

