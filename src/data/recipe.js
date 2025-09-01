import { adminDb } from "@/lib/firebase/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// 모든 레시피 get
async function fetchRecipes() {
  const querySnapshot = await adminDb
    .collection("Recipe")
    .orderBy("date", "desc")
    .get();

  if (querySnapshot.empty) {
    console.log("No matching documents.");
    return [];
  }

  const RecipeData = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const aRecipe = {
      id: doc.id,
      date: data?.date?.toDate?.() ?? null,
      email: data.email ?? null,
      name: data.name ?? null,
      title: data.title ?? "",
      recipe: data.recipe ?? "",
      summary: data.summary ?? "",
      image: data.image ?? null,
      like: data.like ?? 0,
      check: data.check ?? 0,
      lastlike: data.lastlike ?? null,
      type: data.type ?? "recipe",
    };

    RecipeData.push(aRecipe);
  });

  return RecipeData;
}

// 레시피 단일 get
async function fetchRecipe(id) {
  if (!id) {
    return null;
  }

  const RecipedocRef = adminDb.collection("Recipe").doc(id);
  const doc = await RecipedocRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() ?? {};
  return {
    id: doc.id,
    date: data.date?.toDate?.() ?? null,
    email: data.email ?? null,
    name: data.name ?? null,
    title: data.title ?? "",
    recipe: data.recipe ?? "",
    summary: data.summary ?? "",
    image: data.image ?? null,
    like: data.like ?? 0,
    check: data.check ?? 0,
    lastlike: data.lastlike ?? null,
    type: data.type ?? "recipe",
  };
}

//레시피 add
async function addRecipe({
  email,
  name,
  recipe,
  summary,
  title,
  image,
  like,
  check,
}) {
  const RecipeRef = adminDb.collection("Recipe").doc();
  const now = Timestamp.now();

  const newRecipeData = {
    id: RecipeRef.id,
    date: now,
    email: email ?? null,
    name: name ?? null,
    title: title ?? "",
    recipe: recipe ?? "",
    summary: summary ?? "",
    image: image ?? null,
    like: like ?? 0,
    check: check ?? 0,
    lastlike: null,
    type: "recipe",
  };

  await RecipeRef.set(newRecipeData);

  return {
    id: RecipeRef.id,
    date: now.toDate(),
    email: newRecipeData.email,
    name: newRecipeData.name,
    title: newRecipeData.title,
    recipe: newRecipeData.recipe,
    summary: newRecipeData.summary,
    image: newRecipeData.image,
    like: newRecipeData.like,
    check: newRecipeData.check,
    lastlike: newRecipeData.lastlike,
    type: newRecipeData.type,
  };
}

// 레시피 단일 삭제
async function deleteARecipe(id) {
  const fetchedrecipe = await fetchRecipe(id);

  if (!fetchedrecipe) {
    return null;
  }

  await adminDb.collection("Recipe").doc(id).delete();

  return fetchedrecipe;
}

// 레시피 단일 수정
async function editARecipe(
  id,
  { email, name, title, summary, recipe, image, like, check, lastlike }
) {
  const fetchedrecipe = await fetchRecipe(id);

  if (!fetchedrecipe) {
    return null;
  }

  const RecipeRef = adminDb.collection("Recipe").doc(id);

  const updatedata = {
    ...(email !== undefined ? { email } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(summary !== undefined ? { summary } : {}),
    ...(recipe !== undefined ? { recipe } : {}),
    ...(image !== undefined ? { image } : {}),
    ...(like !== undefined ? { like } : {}),
    ...(lastlike !== undefined ? { lastlike } : {}),
  };

  if (check === "increment") {
    updatedata.check = FieldValue.increment(1);
  } else if (check !== undefined) {
    updatedata.check = check;
  }
  await RecipeRef.update(updatedata);

  const afterSnap = await RecipeRef.get();
  const data = afterSnap.data() ?? {};

  return {
    id,
    date: data.date?.toDate?.() ?? null,
    email: data.email ?? null,
    name: data.name ?? null,
    title: data.title ?? "",
    recipe: data.recipe ?? "",
    summary: data.summary ?? "",
    image: data.image ?? null,
    like: data.like ?? 0,
    check: data.check ?? 0,
    lastlike: data.lastlike ?? null,
    type: data.type ?? "recipe",
  };
}

export { fetchRecipes, fetchRecipe, addRecipe, deleteARecipe, editARecipe };
