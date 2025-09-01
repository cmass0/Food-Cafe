import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { adminDb } from "@/lib/firebase/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// 모든 user get
async function fetchUsers() {
  const querySnapshot = await adminDb.collection("User").orderBy("date", "desc").get();

  if (querySnapshot.empty) {
    console.log('No matching documents.');
    return [];
  }

  const UserData = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const User = {
      id: doc.id,
      date: data?.date?.toDate?.() ?? null,
      email: data.email ?? null,
      username: data.username ?? null,
      likerecipe: data.likerecipe ?? 0,
    };
    UserData.push(User);
  });

  return UserData;
}

// 단일 get
async function fetchUser(id) {
  if (id === null) {
    return null;
  }

  const Userdocref = adminDb.collection("User").doc(id);
  const UserdocSnap = await Userdocref.get();

  if (UserdocSnap.exist) {
    const data = UserdocSnap.data();

    const fetchUser = {
      username: data.username ?? "null",
      likerecipe: data.likerecipe ?? "null",
    };

    return fetchUser;
  } else {
    console.log("No such document!");
    return null;
  }
}

// 추가
async function addUser({ email, username, password, likerecipe }) {

   const createuser = await getAdminAuth().createUser({
    email,
    password,
    displayName: username ?? undefined,
    disabled: false,
  });

  const newUserRef = adminDb.collection('User').doc(createuser.uid);
  const now = Timestamp.now();

  const newUserData = {
    id: createuser.uid,
    username: username ?? null,
    email: email ?? null,
    date: now,
    likerecipe,
  };

  await newUserRef.set(newUserData);

  return {
    id: createuser.uid,
    name: username,
    date: now,
    email: email ?? null,
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
