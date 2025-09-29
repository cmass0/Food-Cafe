import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getPrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  return key.includes("\n") ? key : key.replace(/\\n/g, "\n");
}

const hasApp = getApps().length > 0;
const app = hasApp
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });

export const adminDb = getFirestore(app);

if (!hasApp) {
  adminDb.settings({ ignoreUndefinedProperties: true });
}
