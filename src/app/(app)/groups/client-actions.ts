
'use client';

import {
  addDoc,
  collection,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

interface GroupData {
  name: string;
  contributionAmount: number;
  contributionFrequency: 'weekly' | 'monthly';
}

export async function createGroup(
  firestore: Firestore,
  creatorUid: string,
  data: GroupData
): Promise<{ success: boolean; error?: string }> {
  try {
    const groupsCollectionRef = collection(firestore, `groups`);
    await addDoc(groupsCollectionRef, {
      ...data,
      creatorUid,
      members: [creatorUid], // The creator is the first member
      status: 'forming', // Groups start in a 'forming' state
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error creating group:', error);
    return { success: false, error: 'Failed to create group.' };
  }
}
