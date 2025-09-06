'use client';

import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

export async function fetchUsernameByUid(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'User', uid));
  const data = snap.exists() ? snap.data() : null;
  return (data as any)?.username ?? null;
}
