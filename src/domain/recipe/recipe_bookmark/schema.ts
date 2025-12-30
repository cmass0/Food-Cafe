import { z } from "zod";

export const toggleBookmarkSchema = z.object({
  userId: z.string().min(1, "유효하지 않은 사용자 ID입니다."),
  recipeId: z.string().min(1, "유효하지 않은 레시피 ID입니다."),
  currentlyBookmarked: z.boolean(),
});
