// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage } from "./firestore";

// export default async function uploadImage(file) {
//   const storageRef = ref(storage, `images/${file.name}`);
//   const snapshot = await uploadBytes(storageRef, file);
//   const imageUrl = await getDownloadURL(snapshot.ref);
//   return imageUrl;
// }

import { storage } from "./firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default async function uploadImage(imageFile) {
  if (!imageFile) return null;

  const storageRef = ref(storage, `images/${Date.now()}`);
  await uploadBytes(storageRef, imageFile);

  return getDownloadURL(storageRef);
}
