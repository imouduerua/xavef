
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
  writeBatch,
  increment,
  Timestamp,
} from 'firebase/firestore';
import type { Group, GroupJoinRequest, UserData } from '@/lib/types';
import type { User } from 'firebase/auth';

interface GroupData {
  name: string;
  contributionAmount: number;
  contributionFrequency: 'weekly';
  numberOfMembers: number;
}

/**
 * Shuffles an array in-place using the Fisher-Yates algorithm.
 * @param array The array to shuffle.
 * @returns The shuffled array.
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function createGroup(
  firestore: Firestore,
  creatorUid: string,
  data: GroupData
): Promise<{ success: boolean; error?: string }> {
  if (!firestore?.collection) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const groupsCollectionRef = collection(firestore, `groups`);
    await addDoc(groupsCollectionRef, {
      ...data,
      creatorUid,
      members: [creatorUid], // The creator is the first member
      status: 'forming', // Groups start in a 'forming' state
      createdAt: serverTimestamp(),
      currentCollectionWeek: 0,
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
): Promise<{ success: boolean; error?: string }> {
  if (!firestore?.doc) {
    return { success: false, error: 'Database not initialized.' };
  }
  const groupDocRef = doc(firestore, 'groups', groupId);
  try {
    const groupSnap = await getDoc(groupDocRef);
    if (!groupSnap.exists()) {
      throw new Error('Group not found.');
    }
    const groupData = groupSnap.data() as Group;

    // Shuffle the members to create the payout order
    const payoutOrder = shuffleArray([...groupData.members]);

    // Start a write batch to perform multiple operations atomically
    const batch = writeBatch(firestore);

    // 1. Update the group status, startedAt timestamp, and payoutOrder
    batch.update(groupDocRef, {
      status: 'active',
      startedAt: serverTimestamp(),
      payoutOrder: payoutOrder,
      currentCollectionWeek: 1, // Start at week 1
      lastDistributionDate: null,
    });

    // 2. Create a notification for each member
    for (const memberId of groupData.members) {
      const userNotificationsRef = collection(
        firestore,
        `users/${memberId}/notifications`
      );
      const newNotification = {
        userId: memberId,
        title: 'Group Started!',
        description: `The savings group "${groupData.name}" has officially started.`,
        createdAt: serverTimestamp(),
        read: false,
        actionUrl: `/groups/${groupId}`,
      };
      batch.set(doc(userNotificationsRef), newNotification);
    }

    // Commit the batch
    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('Error starting group:', error);
    return { success: false, error: error.message || 'Failed to start group.' };
  }
}

export async function requestToJoinGroup(
  firestore: Firestore,
  requester: User,
  group: Group
): Promise<{ success: boolean; error?: string }> {
  if (!firestore?.collection) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const joinRequestsRef = collection(firestore, 'joinRequests');

    // Check if a request already exists
    const q = query(
      joinRequestsRef,
      where('groupId', '==', group.id),
      where('requesterUid', '==', requester.uid),
      limit(1)
    );
    const existingRequestSnap = await getDocs(q);
    if (!existingRequestSnap.empty) {
      const existingRequest = existingRequestSnap.docs[0].data();
      if (existingRequest.status === 'pending') {
        return {
          success: false,
          error: 'You have already requested to join this group.',
        };
      }
      if (existingRequest.status === 'declined') {
        return {
          success: false,
          error: 'Your previous request to join this group was declined.',
        };
      }
      if (existingRequest.status === 'approved') {
        return {
          success: false,
          error: 'You are already a member of this group.',
        };
      }
    }

    await addDoc(joinRequestsRef, {
      groupId: group.id,
      groupName: group.name,
      groupCreatorUid: group.creatorUid,
      requesterUid: requester.uid,
      requesterEmail: requester.email,
      requesterName: requester.displayName,
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
  if (!firestore?.runTransaction) {
    return { success: false, error: 'Database not initialized.' };
  }
  const requestDocRef = doc(firestore, 'joinRequests', requestId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const requestSnap = await transaction.get(requestDocRef);
      if (!requestSnap.exists() || requestSnap.data().status !== 'pending') {
        throw new Error(
          'This join request is no longer valid or has already been actioned.'
        );
      }

      const requestData = requestSnap.data() as GroupJoinRequest;
      const groupDocRef = doc(firestore, 'groups', requestData.groupId);
      
      const groupSnap = await transaction.get(groupDocRef);
      if (!groupSnap.exists()) {
        throw new Error('The associated group could not be found.');
      }
      const groupData = groupSnap.data() as Group;
      if (groupData.members.length >= groupData.numberOfMembers && decision === 'approved') {
        throw new Error('This group is already full.');
      }

      // Update the request status to reflect the decision
      transaction.update(requestDocRef, {
        status: decision,
        respondedAt: serverTimestamp(),
      });

      if (decision === 'approved') {
        // Atomically add the new member to the group's member array
        transaction.update(groupDocRef, {
          members: arrayUnion(requestData.requesterUid),
        });

        // Create a notification for the accepted user
        const userNotificationsRef = collection(
          firestore,
          `users/${requestData.requesterUid}/notifications`
        );
        const newNotification = {
          userId: requestData.requesterUid,
          title: "You've been accepted!",
          description: `You are now a member of the group "${requestData.groupName}".`,
          createdAt: serverTimestamp(),
          read: false,
          actionUrl: `/groups/${requestData.groupId}`,
        };
        transaction.set(doc(userNotificationsRef), newNotification);
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error responding to join request:', error);
    return {
      success: false,
      error: error.message || 'Failed to process the request.',
    };
  }
}

export async function distributeGroupFunds(
  firestore: Firestore,
  groupId: string,
  recipientUid: string,
  totalPurse: number
): Promise<{ success: boolean; error?: string }> {
  if (!firestore?.runTransaction) {
    return { success: false, error: 'Database not initialized.' };
  }
  const groupRef = doc(firestore, 'groups', groupId);
  const recipientUserRef = doc(firestore, 'users', recipientUid);

  try {
    await runTransaction(firestore, async (transaction) => {
      const groupSnap = await transaction.get(groupRef);
      if (!groupSnap.exists()) throw new Error('Group not found.');

      const groupData = groupSnap.data() as Group;
      if (groupData.status !== 'active') {
        throw new Error('This group is not active.');
      }
      
      const currentWeek = groupData.currentCollectionWeek || 1;
      const recipientDoc = await transaction.get(recipientUserRef);
       if (!recipientDoc.exists()) {
        throw new Error('Recipient user data not found.');
      }
      const recipientName = recipientDoc.data()?.displayName || 'A member';


      // 1. Credit the recipient's Olidara balance
      transaction.update(recipientUserRef, {
        solidaraBalance: increment(totalPurse),
      });

      // 2. Create a "Group Payout" transaction for the recipient
      const recipientTxRef = doc(
        collection(firestore, `users/${recipientUid}/transactions`)
      );
      transaction.set(recipientTxRef, {
        amount: totalPurse,
        date: serverTimestamp(),
        description: `Group payout from "${groupData.name}"`,
        type: 'Group Payout',
        status: 'Completed',
        groupId: groupId,
      });

      // 3. Update the group to the next collection week
      transaction.update(groupRef, {
        currentCollectionWeek: increment(1),
        lastDistributionDate: serverTimestamp(),
      });

      // 4. Create notifications for all members
      for (const memberId of groupData.members) {
        const notificationRef = doc(
          collection(firestore, `users/${memberId}/notifications`)
        );
        transaction.set(notificationRef, {
          userId: memberId,
          title: `Week ${currentWeek} Payout Complete!`,
          description: `${recipientName} has received the Week ${currentWeek} payout of ₦${totalPurse.toFixed(
            2
          )} from group "${groupData.name}".`,
          createdAt: serverTimestamp(),
          read: false,
          actionUrl: `/groups/${groupId}`,
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error distributing group funds:', error);
    return {
      success: false,
      error: error.message || 'Failed to distribute funds.',
    };
  }
}

export async function contributeToGroupFromSavings(
  firestore: Firestore,
  userId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  if (!firestore?.doc) {
    return { success: false, error: 'Database not initialized.' };
  }
  const groupRef = doc(firestore, 'groups', groupId);
  const userRef = doc(firestore, 'users', userId);
  const userTransactionsRef = collection(userRef, 'transactions');

  // We must perform the read for existing contributions *outside* the transaction.
  try {
    const groupSnapForCheck = await getDoc(groupRef);
     if (!groupSnapForCheck.exists()) {
      return { success: false, error: 'Group not found.' };
    }
    const group = groupSnapForCheck.data() as Group;

    if (group.status !== 'active') {
       return { success: false, error: 'This group is not active.' };
    }
    if (!group.startedAt) {
      return { success: false, error: 'Group start date is not set.' };
    }

    const startDate = group.startedAt.toDate();
    const currentWeek = group.currentCollectionWeek || 1;
    const weekOffset = (currentWeek - 1) * 7;
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + weekOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weeklyContributionQuery = query(
      userTransactionsRef,
      where('groupId', '==', groupId),
      where('type', '==', 'Group Contribution'),
      where('date', '>=', Timestamp.fromDate(weekStart)),
      where('date', '<', Timestamp.fromDate(weekEnd)),
      limit(1)
    );
      
    const existingContributions = await getDocs(weeklyContributionQuery);
    if (!existingContributions.empty) {
      return { success: false, error: 'You have already contributed for this week.' };
    }
  } catch (error: any) {
     console.error('Error checking for existing contributions:', error);
     return { success: false, error: 'Could not verify your contribution status.' };
  }

  try {
    await runTransaction(firestore, async (transaction) => {
      const groupSnap = await transaction.get(groupRef);
      const userSnap = await transaction.get(userRef);

      if (!groupSnap.exists()) throw new Error('Group not found.');
      if (!userSnap.exists()) throw new Error('User not found.');

      const group = groupSnap.data() as Group;
      const user = userSnap.data() as UserData;

      if (group.status !== 'active') {
        throw new Error('This group is not active.');
      }

      if (user.solidaraBalance < group.contributionAmount) {
        throw new Error('Insufficient Olidara balance to make contribution.');
      }

      // 1. Debit the user's Olidara balance
      transaction.update(userRef, {
        solidaraBalance: increment(-group.contributionAmount),
      });

      // 2. Create a "Group Contribution" transaction for the user
      const newTxRef = doc(userTransactionsRef);
      transaction.set(newTxRef, {
        amount: group.contributionAmount, // Positive amount for the contribution itself
        date: serverTimestamp(),
        description: `Weekly contribution to group "${group.name}"`,
        type: 'Group Contribution',
        status: 'Completed',
        groupId: groupId,
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error contributing to group from savings:', error);
    return {
      success: false,
      error: error.message || 'Failed to make contribution.',
    };
  }
}
