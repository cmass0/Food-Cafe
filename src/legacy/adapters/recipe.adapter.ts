/**
 * PURPOSE: 기존 Firebase 기반 레시피 유틸을 어댑터로 노출하여
 *          점진 이관 동안 기존 호출 경로가 끊기지 않도록 합니다.
 *
 * NOTE: 현재는 Firebase 경로(src/data/recipe.js)를 그대로 위임(export)
 *       합니다. 이후 Supabase repository로 전환할 때 이 파일만 수정하면
 *       상위 호출부는 변경 없이 동작하도록 의도했습니다.
 */

export {
  fetchRecipes,
  fetchRecipe,
  addRecipe,
  deleteARecipe,
  editARecipe,
} from "@/data/recipe";

