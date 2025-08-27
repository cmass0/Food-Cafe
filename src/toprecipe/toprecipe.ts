import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export type TopRecipe = {
  id: string;
  title: string;
  name: string;
  email: string;
  summary: string;
  image: string;
  like: number;
  check: boolean;
};

export async function getTopRecipes(limitCount = 3): Promise<TopRecipe[]> {
  const snap = await adminDb
    .collection("Recipe")
    .orderBy("like", "desc")
    .limit(limitCount)
    .get();

  return snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      title: x.title ?? "",
      name: x.name ?? "",
      email: x.email ?? "",
      summary: x.summary ?? "",
      image: x.image ?? "",
      like: x.like ?? 0,
      check: !!x.check,
    };
  });
}
