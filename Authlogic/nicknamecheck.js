import { collection, query, where, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/data/firestore";

async function checkDuplicate(username) {
  const userRef = collection(db, "User");
  const q = query(userRef, where("username", "==", username));
  const querySnap = await getDocs(q);
  return !querySnap.empty;
}

export { checkDuplicate };
