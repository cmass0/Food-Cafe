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
  increment,
} from "firebase/firestore";
import { app, db, Auth } from "./firestore";

// 모든 post get
async function fetchPosts() {
  const querySnapshot = await getDocs(collection(db, "Post")); // 오타 수정: "Recipe" -> "Recipe"
  if (querySnapshot.empty) {
    return []; // 쿼리 결과가 비어있을 때 빈 배열 반환
  }

  const PostData = [];

  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
    const aPost = {
      id: doc.id,
      date: doc.data()["date"].toDate(),
      title: doc.data()["title"],
      content: doc.data()["content"],
      writer: doc.data()["writer"],
      number: doc.data()["number"],
      check: doc.data()["check"],
      type: doc.data()["type"],
    };
    // .toLocaleTimeString("ko")
    PostData.push(aPost);
  });

  return PostData;
}

// post 단일 get
async function fetchPost(id) {
  if (id === null) {
    return null;
  }

  const PostdocRef = doc(db, "Post", id);
  const PostdocSnap = await getDoc(PostdocRef);

  if (PostdocSnap.exists()) {
    console.log("Document data:", PostdocSnap.data());

    const fetchedPost = {
      id: PostdocSnap.id || "null",
      date: PostdocSnap.data()["date"].toDate() || "null",
      title: PostdocSnap.data()["title"] || "null",
      content: PostdocSnap.data()["content"] || "null",
      number: PostdocSnap.data()["number"] || "null",
      writer: PostdocSnap.data()["writer"] || "null",
      check: PostdocSnap.data()["check"] || "null",
      type: PostdocSnap.data()["check"] || "null"
    };

    return fetchedPost;
  } else {
    // docSnap.data() will be undefined in this case
    console.log("No such document!");
    return null;
  }
}

// add
async function addPost({ writer, title, content, check, number }) {
  const postdata = query(collection(db, "Post"));
  const newPostRef = doc(collection(db, "Post"));
  const querySnapshot = await getDocs(postdata);
  const totalpost = querySnapshot.size;
  // const number = totalpost + 1;

  const createAT = Timestamp.fromDate(new Date());

  const newPostData = {
    id: newPostRef.id,
    date: createAT,
    writer,
    content,
    title,
    number,
    check: check || 0,
    type: 'board',
  };

  // later...
  await setDoc(newPostRef, newPostData);
  console.log("totalpost: ", totalpost);

  return {
    id: newPostRef.id,
    date: createAT.toDate(),
    writer,
    title,
    content,
    number,
  };
}

// post 단일 삭제
async function deleteAPost(id) {
  const fetchedPost = await fetchPost(id);

  if (!fetchedPost) {
    return null;
  }

  await deleteDoc(doc(db, "Post", id));

  return fetchedPost;
}

// post 단일 수정
async function editAPost(id, { title, writer, content, check }) {
  const fetchedPost = await fetchPost(id);

  if (!fetchedPost) {
    return null;
  }

  const PostRef = doc(db, "Post", id);

  // Set the "capital" field of the city 'DC'

  const updatedata = {
    content: content !== undefined ? content : fetchedPost.content,
    title: title !== undefined ? title : fetchedPost.title,
    writer: writer !== undefined ? writer : fetchedPost.writer,
  };

  if (check === "increment") {
    updatedata.check = increment(1);
  }
  await updateDoc(PostRef, updatedata);

  return {
    id,
    content,
    title,
    writer,
    check: updatedata.check,
    date: fetchPost.date,
  };
}

export { fetchPosts, fetchPost, addPost, deleteAPost, editAPost };
