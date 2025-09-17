import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

// 모든 post get
async function fetchcommets() {
  const querySnapshot = await adminDb
    .collection("comment")
    .orderBy("date", "desc")
    .get();

  if (querySnapshot.empty) {
    return [];
  }

  const commentData = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    commentData.push({
      id: doc.id,
      date: data.date?.toDate?.() ?? null,
      comment: data.comment ?? null,
      writer: data.writer ?? null,
      type: data.type ?? null,
    });
  });

  return commentData;
}

// post 단일 get
async function fetchcomment(id) {
  if (id === null) {
    return null;
  }

  const CommentSnap = await adminDb.collection("Comment").doc(id).get();

  if (!CommentSnap.exists) return null;
  const data = CommentSnap.data();
  return {
    id: snapshot.id,
    date: data.date?.toDate?.() ?? null,
    email: data.email ?? null,
    writer: data.writer ?? null,
    comment: data.comment ?? null,
    type: data.type ?? null,
  };
}

//레시피 add
async function addcomment({ comment, writer, type }) {
  // Add a new document with a generated id
  const CommentRef = adminDb.collection("Comment");
  const newRef = CommentRef.doc();
  const now = Timestamp.now();

  const newCommentData = {
    id: newRef.id,
    date: now,
    comment: comment ?? null,
    writer: writer ?? null,
    type: type ?? null,
  };

  // later...
  await newRef.set(newCommentData);

  return {
    id: newRef.id,
    date: now.toDate(),
    comment: comment ?? null,
    writer: writer ?? null,
    type: type ?? null,
  };
}

// post 단일 삭제
async function deletecomment(id) {
  const snap = await adminDb.collection("Comment").doc(id).get();
  if (!snap.exists) return null;

  const data = snap.data();
  await adminDb.collection("Comment").doc(id).delete();
  return {
    id,
    date: data.date?.toDate?.() ?? null,
    comment: data.comment ?? null,
    writer: data.writer ?? null,
    type: data.type ?? null,
  };
}

// post 단일 수정
async function editcomment(id, { email, name, title, summary, recipe, image }) {
  // const fetchedcomment = await fetchcomment(id);

  // if (!fetchedcomment) {
  //   return null;
  // }

  const ref = adminDb.collection("Comment").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  // Set the "capital" field of the city 'DC'
  const updateData = {
    email: email ?? snap.data().email,
    name: name ?? snap.data().name,
    title: title ?? snap.data().title,
    summary: summary ?? snap.data().summary,
    recipe: recipe ?? snap.data().recipe,
    image: image ?? snap.data().image,
  };
  await ref.update(updateData);
  const updatedData = (await ref.get()).data();

  return {
    id,
    email: updatedData.email ?? null,
    name: updatedData.name ?? null,
    title: updatedData.title ?? null,
    summary: updatedData.summary ?? null,
    recipe: updatedData.recipe ?? null,
    image: updatedData.image ?? null,
    date: updatedData.date.toDate?.() ?? null,
  };
}

export { fetchcommets, fetchcomment, addcomment, deletecomment, editcomment };
