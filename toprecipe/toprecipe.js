import { db } from "@/data/firestore";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  Timestamp,
  where,
  query,
} from "firebase/firestore";

export async function TopRecipe() {
  const oneWeekAgo = Timestamp.fromDate(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const RecipeRef = collection(db, "Recipe");

  const qur = query(
    RecipeRef,
    // orderBy("lastlike", "asc"),
    orderBy("like", "desc"),
    // orderBy("__name__", "desc"),
    limit(3)
  );

  console.log("query: ", qur);

  const querysnap = await getDocs(qur);
  const TopRecipe = [];
  querysnap.forEach((doc) => {
    const data = doc.data();
    const Recipe = {
      id: data.id,
      title: data.title,
      name: data.name,
      email: data.email,
      summary: data.summary,
      image: data.image,
      like: data.like,
      check: data.check,
    };
    TopRecipe.push(Recipe);
  });

  return TopRecipe;
}
