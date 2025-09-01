import { adminDb } from "@/lib/firebase/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

// 모든 user get
async function fetchUsers() {
  const querySnapshot = await adminDb
    .collection("User")
    .orderBy("date", "desc")
    .get();

  if (querySnapshot.empty) {
    console.log("No matching documents.");
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

  const Userref = adminDb.collection("User").doc(id);
  const UserSnap = await Userref.get();

  if (!UserSnap.exists) return null;

  const data = UserSnap.data() || {};

  return {
    id: UserSnap.id,
    date: data.date?.toDate?.() ?? null,
    email: data.email ?? null,
    username: data.username ?? null,
    likerecipe: data.likerecipe ?? 0,
  };
}

// 추가
async function addUser({ email, username, password, likerecipe }) {
  const createuser = await getAdminAuth().createUser({
    email,
    password,
    displayName: username ?? undefined,
    disabled: false,
  });

  const newUserRef = adminDb.collection("User").doc(createuser.uid);
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
    username: username,
    date: now,
    email: email ?? null,
  };
}

//  삭제
async function deleteAUser(id) {
  const fetchedUser = await fetchUser(id);

  if (!fetchedUser) {
    return null;
  }

  await adminDb.collection("User").doc(id).delete();

  return fetchedUser;
}

// 단일 수정
// async function editAUser(id, { email, name, title, summary, recipe, image }) {
//   const fetchUser = await fetchRecipe(id);

//   if (!fetchUser) {
//     return null;
//   }

//   const RecipeRef = adminDb.collection("Recipe").doc(id);

//   const updatedata = {
//     ...(image !== undefined ? { image } : {}),
//     ...(name !== undefined ? { name } : {}),
//     ...(title !== undefined ? { title } : {}),
//     ...(summary !== undefined ? { summary } : {}),
//     ...(recipe !== undefined ? { recipe } : {}),
//     ...(email !== undefined ? { email } : {}),
//   };

//   await RecipeRef.update(updatedata);

//   const afterSnap = await RecipeRef.get();
//   const data = afterSnap.data() ?? {};

//   return {
//     id,
//     date: fetchRecipe.date,
//     email,
//     name,
//     title,
//     summary,
//     recipe,
//     image,
//   };
// }

export { fetchUsers, fetchUser, addUser, deleteAUser };
