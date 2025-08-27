import "server-only";
import { initializeApp, getApps, applicationDefault } from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) initializeApp({ credential: applicationDefault() });
export const adminDb = getFirestore();
