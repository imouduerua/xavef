'use server';

import { firestore } from '@/firebase/server-init';
import { getAuthenticatedUser } from '@/firebase/server-auth';
import { collection, query, where, getDocs, limit, doc, setDoc, deleteDoc } from 'firebase/firestore';

async function verifyAdmin() {
    const user = await getAuthenticatedUser();
    if (!user) {
        throw new Error('Authentication required.');
    }
    
    // Check for hardcoded admin first for bootstrapping
    if (user.email === 'admin@xavef.com') {
        return user;
    }

    const adminDoc = await firestore.collection('admins').doc(user.uid).get();
    if (!adminDoc.exists) {
        throw new Error('Permission denied. You are not an administrator.');
    }
    return user;
}


export async function findUserByEmail(email: string): Promise<{
    id: string;
    email: string;
    displayName: string;
    isAdmin: boolean;
} | null> {
    await verifyAdmin();

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    const adminDoc = await firestore.collection('admins').doc(userDoc.id).get();

    return {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        isAdmin: adminDoc.exists,
    };
}


export async function promoteToAdmin(userId: string, userEmail: string, displayName: string): Promise<{ success: boolean, error?: string }> {
    const promoter = await verifyAdmin();

    try {
        const adminRef = doc(firestore, 'admins', userId);
        await setDoc(adminRef, {
            isAdmin: true,
            promotedBy: promoter.email,
            promotedAt: new Date(),
            email: userEmail,
            displayName: displayName,
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function revokeAdmin(userId: string): Promise<{ success: boolean, error?: string }> {
    const revoker = await verifyAdmin();

    if (userId === revoker.uid) {
        return { success: false, error: "You cannot revoke your own admin privileges." };
    }

    try {
        const adminRef = doc(firestore, 'admins', userId);
        await deleteDoc(adminRef);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
