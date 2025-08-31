import { adminDb } from "@/lib/firebase/server";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

// 모든 post get
async function fetchPosts() {
  const querySnapshot = await adminDb.collection('Post').orderBy('date', 'desc').get();
  if (querySnapshot.empty) {
    return []; // 쿼리 결과가 비어있을 때 빈 배열 반환
  }

  const PostData = [];
  querySnapshot.forEach((doc) => {
    const aPost = {
      id: doc.id,
      date: doc.data()?.date?.toDate?.() ?? null,
      title: doc.data()["title"],
      content: doc.data()["content"],
      writer: doc.data()["writer"],
      number: doc.data()?.number ?? 0,
      check: doc.data()?.check ?? 0,
      type: doc.data()?.type ?? 'board',
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

  const PostdocSnap = await adminDb.collection('Post').doc(id).get();

  if (PostdocSnap.exists) {
    console.log("Document data:", PostdocSnap.data());

    const fetchedPost = {
      id: PostdocSnap.id || "null",
      date: PostdocSnap.data()["date"].toDate() || "null",
      title: PostdocSnap.data()["title"] || "null",
      content: PostdocSnap.data()["content"] || "null",
      number: PostdocSnap.data()["number"] || "null",
      writer: PostdocSnap.data()["writer"] || "null",
      check: PostdocSnap.data()["check"] ?? 0,
      type: PostdocSnap.data()["type"] ?? "board",
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

  const col = adminDb.collection("Post");
  const newPostRef = col.doc();
  const totalpostSnap = await col.count().get?.().catch(async () => {
    const snap = await col.get();
    return { data: () => ({ count: snap.size }) };
  });
  const totalpost = totalpostSnap?.data?.().count ?? 0;
  // const number = totalpost + 1;

  
  const createAT = Timestamp.now();

  const newPostData = {
    id: newPostRef.id,
    date: createAT,
    writer,
    content,
    title,
    number: number ?? totalpost + 1,
    check: check ?? 0,
    type: 'board',
  };

  // later...
  await newPostRef.set(newPostData);

  return {
    id: newPostRef.id,
    date: createAT.toDate(),
    writer,
    title,
    content,
    number: newPostData.number,
  };
}

// post 단일 삭제
async function deleteAPost(id) {
  const fetchedPost = await fetchPost(id);

  if (!fetchedPost) {
    return null;
  }

  await adminDb.collection("Post").doc(id).delete();

  return fetchedPost;
}

// post 단일 수정
async function editAPost(id, { title, writer, content, check }) {
  const fetchedPost = await fetchPost(id);

  if (!fetchedPost) {
    return null;
  }

  const PostRef = adminDb.collection("Post").doc(id);

  // Set the "capital" field of the city 'DC'

  const updatedata = {
    content: content !== undefined ? content : fetchedPost.content,
    title: title !== undefined ? title : fetchedPost.title,
    writer: writer !== undefined ? writer : fetchedPost.writer,
  };

  if (check === "increment") {
    updatedata.check = FieldValue.increment(1);
  }
  await PostRef.update(updatedata);

  return {
    id,
    content,
    title,
    writer,
    check: updatedata.check,
    date: fetchedPost.date,
  };
}

export { fetchPosts, fetchPost, addPost, deleteAPost, editAPost };
