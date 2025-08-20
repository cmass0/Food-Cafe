import { initializeApp, getApps, getApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  Timestamp,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { app, db, Auth } from "./firestore";

// 모든 user get
async function fetchUsers() {
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
      likerecipe: doc.data()["likeracipe"],
    };
    // .toLocaleTimeString("ko")
    RecipeData.push(aRecipe);
  });

  return RecipeData;
}

// 단일 get
async function fetchUser(id) {
  if (id === null) {
    return null;
  }

  const Userdocref = doc(db, "User", id);
  const UserdocSnap = await getDoc(Userdocref);

  if (UserdocSnap.exists()) {
    console.log("Document data:", UserdocSnap.data());

    const fetchUser = {
      username: UserdocSnap.data()["username"] || "null",
      likerecipe: UserdocSnap.data()["likerecipe"] || "null",
    };

    return fetchUser;
  } else {
    // docSnap.data() will be undefined in this case
    console.log("No such document!");
    return null;
  }
}

// 추가
async function addUser({ email, username, password, likerecipe }) {
  // Add a new document with a generated id
  // const newUserRef = doc(collection(db, "User"));

  const createuser = await createUserWithEmailAndPassword(
    Auth,
    email,
    password
  );
  // sessionStorage.setItem("user", true);

  const user = createuser.user;

  const newUserRef = doc(db, "User", user.uid);
  const createAT = Timestamp.fromDate(new Date());

  const newUserData = {
    id: user.uid,
    username: username || null,
    email: email || null,
    date: createAT,
    likerecipe,
  };

  // later...
  await setDoc(newUserRef, newUserData);

  return {
    id: user.uid,
    name: username,
    date: createAT.toDate(),
    email: email || null,
  };
}

//  삭제
async function deleteAUser(id) {
  const fetchUser = await fetchRecipe(id);

  if (!fetchUser) {
    return null;
  }

  await deleteDoc(doc(db, "Recipe", id));

  return fetchUser;
}

// 단일 수정
async function editAUser(id, { email, name, title, summary, recipe, image }) {
  const fetchUser = await fetchRecipe(id);

  if (!fetchUser) {
    return null;
  }

  const RacipeRef = doc(db, "Recipe", id);

  // Set the "capital" field of the city 'DC'
  await updateDoc(RacipeRef, {
    image,
    email,
    name,
    title,
    summary,
    recipe,
  });

  return {
    id,
    email,
    name,
    title,
    summary,
    recipe,
    image,
    date: fetchRecipe.date,
  };
}

export { fetchUsers, fetchUser, addUser, deleteAUser, editAUser };
