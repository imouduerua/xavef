
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
  arrayUnion,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import type { Group, GroupJoinRequest } from '@/lib/types';
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
        if (existingRequest.status === 'approved') {
            return { success: false, error: 'You are already a member of this group.' };
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


export async function respondToJoinRequest(
  firestore: Firestore,
  requestId: string,
  decision: 'approved' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  const requestDocRef = doc(firestore, 'joinRequests', requestId);
  
  try {
    await runTransaction(firestore, async (transaction) => {
        const requestSnap = await transaction.get(requestDocRef);
        if (!requestSnap.exists() || requestSnap.data().status !== 'pending') {
            throw new Error("This join request is no longer valid or has already been actioned.");
        }
        
        const requestData = requestSnap.data() as GroupJoinRequest;
        const groupDocRef = doc(firestore, 'groups', requestData.groupId);
        
        if (decision === 'approved') {
            const groupSnap = await transaction.get(groupDocRef);
            if (!groupSnap.exists()) {
                throw new Error("The associated group could not be found.");
            }
            const groupData = groupSnap.data() as Group;
             if (groupData.members.length >= groupData.numberOfMembers) {
                throw new Error("This group is already full.");
            }

            // Atomically add the new member to the group's member array
            transaction.update(groupDocRef, {
                members: arrayUnion(requestData.requesterUid)
            });
        }

        // Update the request status to reflect the decision
        transaction.update(requestDocRef, {
            status: decision,
            respondedAt: serverTimestamp()
        });
    });

    return { success: true };

  } catch (error: any) {
    console.error('Error responding to join request:', error);
    return { success: false, error: error.message || "Failed to process the request." };
  }
}
