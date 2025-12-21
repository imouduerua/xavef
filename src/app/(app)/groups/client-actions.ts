
'use client';

import {
  addDoc,
  collection,
  serverTimestamp,
  Firestore,
  updateDoc,
  doc,
} from 'firebase/firestore';

interface GroupData {
  name: string;
  contributionAmount: number;
  contributionFrequency: 'weekly';
  numberOfMembers: number;
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

export async function startGroup(
    firestore: Firestore,
    groupId: string
): Promise<{ success: boolean; error?: string; }> {
    try {
        const groupDocRef = doc(firestore, 'groups', groupId);
        await updateDoc(groupDocRef, {
            status: 'active',
            startedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error('Error starting group:', error);
        return { success: false, error: 'Failed to start group.' };
    }
}
