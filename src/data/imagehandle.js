"use client";

import { storage } from "../lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default async function uploadImage(imageFile) {
  if (!imageFile) return null;

  const storageRef = ref(storage, `images/${Date.now()}`);
  await uploadBytes(storageRef, imageFile);

  return getDownloadURL(storageRef);
}
