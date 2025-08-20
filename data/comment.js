import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

// 모든 post get
async function fetchcommets() {
  const querySnapshot = await getDocs(collection(db, "Comment"));
  if (querySnapshot.empty) {
    return [];
  }

  const CommentData = [];

  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
    const aComment = {
      id: doc.id,
      date: doc.data()["date"].toDate(),
      comment: doc.data()["comment"] || null,
      writer: doc.data()["writer"] || null,
      type: doc.data()["type"] || null,
    };
    // .toLocaleTimeString("ko")
    CommentData.push(aComment);
  });

  return CommentData;
}

// post 단일 get
async function fetchcomment(id) {
  if (id === null) {
    return null;
  }

  const CommentdocRef = doc(db, "Comment", id);
  const Commentdocsnap = await getDoc(CommentdocRef);

  if (Commentdocsnap.exists()) {
    console.log("Document data:", Commentdocsnap.data());

    const fetchedcomment = {
      id: Commentdocsnap.id || "null",
      date: Commentdocsnap.data()["date"].toDate() || "null",
      email: Commentdocsnap.data()["email"] || "null",
    };

    return fetchedcomment;
  } else {
    // docSnap.data() will be undefined in this case
    console.log("No such document!");
    return null;
  }
}

//레시피 add
async function addcomment({ comment, writer, type }) {
  // Add a new document with a generated id
  const newCommentRef = doc(collection(db, "Comment"));

  const createAT = Timestamp.fromDate(new Date());

  const newCommentData = {
    id: newCommentRef.id,
    date: createAT,
    comment: comment || null,
    writer: writer || null,
    type: type || null,
  };

  // later...
  await setDoc(newCommentRef, newCommentData);

  return {
    id: newCommentRef.id,
    date: createAT.toDate(),
    comment: comment || null,
    writer: writer || null,
    type: type || null,
  };
}

// post 단일 삭제
async function deletecomment(id) {
  const fetchedcomment = await fetchcomment(id);

  if (!fetchedcomment) {
    return null;
  }

  await deleteDoc(doc(db, "Comment", id));

  return fetchedcomment;
}

// post 단일 수정
async function editcomment(id, { email, name, title, summary, recipe, image }) {
  const fetchedcomment = await fetchcomment(id);

  if (!fetchedcomment) {
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
    date: fetchcomment.date,
  };
}

export { fetchcommets, fetchcomment, addcomment, deletecomment, editcomment };
