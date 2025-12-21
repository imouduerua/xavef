
'use client';

import {
  addDoc,
  collection,
  serverTimestamp,
  Firestore,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import type { Group } from '@/lib/types';
import type { User } from 'firebase/auth';

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

export async function requestToJoinGroup(
  firestore: Firestore,
  user: User,
  group: Group
): Promise<{ success: boolean; error?: string }> {
  try {
    const joinRequestsRef = collection(firestore, 'joinRequests');

    // Check if a request already exists
    const q = query(
      joinRequestsRef,
      where('groupId', '==', group.id),
      where('requesterUid', '==', user.uid),
      limit(1)
    );
    const existingRequestSnap = await getDocs(q);
    if (!existingRequestSnap.empty) {
        const existingRequest = existingRequestSnap.docs[0].data();
        if (existingRequest.status === 'pending') {
            return { success: false, error: 'You have already requested to join this group.' };
        }
         if (existingRequest.status === 'declined') {
            return { success: false, error: 'Your previous request to join this group was declined.' };
        }
    }


    await addDoc(joinRequestsRef, {
      groupId: group.id,
      groupName: group.name,
      groupCreatorUid: group.creatorUid,
      requesterUid: user.uid,
      requesterEmail: user.email,
      requesterName: user.displayName,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error creating join request:', error);
    return { success: false, error: 'Failed to create join request.' };
  }
}
