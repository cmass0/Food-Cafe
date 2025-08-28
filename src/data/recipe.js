import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  Timestamp,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import {db } from "./firestore";

// 모든 레시피 get
async function fetchRecipes() {
  const querySnapshot = await getDocs(collection(db, "Recipe"));
  if (querySnapshot.empty) {
    return [];
  }

  const RecipeData = [];

  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
    const aRecipe = {
      id: doc.id,
      date: doc.data()["date"].toDate(),
      email: doc.data()["email"] || "이메일 없음",
      name: doc.data()["name"] || "이름 없음",
      title: doc.data()["title"],
      recipe: doc.data()["recipe"],
      summary: doc.data()["summary"],
      image: doc.data()["image"] || null,
      like: doc.data()["like"] || 0,
      check: doc.data()["check"],
      lastlike: doc.data()["lastlike"],
      type: doc.data()["type"],
    };

    RecipeData.push(aRecipe);
  });

  return RecipeData;
}

// 레시피 단일 get
async function fetchRecipe(id) {
  if (id === null) {
    return null;
  }

  const RecipedocRef = doc(db, "Recipe", id);
  const RecipedocSnap = await getDoc(RecipedocRef);

  if (RecipedocSnap.exists()) {
    console.log("Document data:", RecipedocSnap.data());

    const fetchedRecipe = {
      id: RecipedocSnap.id || "null",
      date: RecipedocSnap.data()["date"].toDate() || "null",
      email: RecipedocSnap.data()["email"] || "null",
      name: RecipedocSnap.data()["name"] || "null",
      title: RecipedocSnap.data()["title"] || "null",
      recipe: RecipedocSnap.data()["recipe"] || "null",
      summary: RecipedocSnap.data()["summary"] || "null",
      image: RecipedocSnap.data()["image"] || "null",
      like: RecipedocSnap.data()["like"] || 0,
      check: RecipedocSnap.data()["check"] || "null",
      lastlike: RecipedocSnap.data()["lastlike"] || "null",
      type: RecipedocSnap.data()["type"] || "null",
    };

    return fetchedRecipe;
  } else {
    console.log("No such document!");
    return null;
  }
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
  const newRecipeRef = doc(collection(db, "Recipe"));

  const createAT = Timestamp.fromDate(new Date());

  const newRecipeData = {
    id: newRecipeRef.id,
    date: createAT,
    email: email || null,
    name: name || null,
    title: title || null,
    recipe: recipe || null,
    summary: summary || null,
    image: image || null,
    like: like || 0,
    check: check || 0,
    lastlike: null,
    type: "meal",
  };

  // later...
  await setDoc(newRecipeRef, newRecipeData);

  return {
    id: newRecipeRef.id,
    date: createAT.toDate(),
    email: email || null,
    name: name || null,
    title: title || null,
    recipe: recipe || null,
    summary: summary || null,
    image: image || null,
    like: like || 0,
  };
}

// 레시피 단일ㅇ 삭제
async function deleteARecipe(id) {
  const fetchedrecipe = await fetchRecipe(id);

  if (!fetchedrecipe) {
    return null;
  }

  await deleteDoc(doc(db, "Recipe", id));

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

  const RacipeRef = doc(db, "Recipe", id);

  // Set the "capital" field of the city 'DC'

  const updatedata = {
    email: email !== undefined ? email : fetchedrecipe.email,
    name: name !== undefined ? name : fetchedrecipe.name,
    title: title !== undefined ? title : fetchedrecipe.title,
    summary: summary !== undefined ? summary : fetchedrecipe.summary,
    recipe: recipe !== undefined ? recipe : fetchedrecipe.recipe,
    image: image !== undefined ? image : fetchedrecipe.image,
    like: like !== undefined ? like : fetchedrecipe.like,
    lastlike: lastlike !== undefined ? lastlike : fetchedrecipe.lastlike,
  };

  if (check === "increment") {
    updatedata.check = increment(1);
  }
  await updateDoc(RacipeRef, updatedata);

  return {
    id,
    email,
    name,
    title,
    summary,
    recipe,
    image,
    like,
    date: fetchRecipe.date,
    check: updatedata.check,
  };
}

export { fetchRecipes, fetchRecipe, addRecipe, deleteARecipe, editARecipe };
