
'use client';

import { useFirebaseApp, useFirestore, useUser } from '@/firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { toast } from './use-toast';
import { useAdminStatus } from './use-admin-status';

export const useFCM = () => {
    const { user } = useUser();
    const { isAdmin } = useAdminStatus();
    const app = useFirebaseApp();
    const firestore = useFirestore();

    const requestPermission = async () => {
        if (!isAdmin || !user) return;

        try {
            const messaging = getMessaging(app);
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                const vapidKey = 'YOUR_VAPID_KEY_HERE'; // This will be replaced by a secure key later
                const fcmToken = await getToken(messaging, { vapidKey: 'BO39KPuT3Yd_lXp1zQpG0fB8G3R0l5oX2vJ5z5M8m8g9R7g6T_f2yC7k3n3j1i1k9h8g5F4d3c2b1a' });

                if (fcmToken) {
                    console.log('FCM Token:', fcmToken);
                    const tokenRef = doc(firestore, `fcmTokens/${user.uid}`);
                    await setDoc(tokenRef, {
                        token: fcmToken,
                        userId: user.uid,
                        updatedAt: serverTimestamp(),
                    }, { merge: true });
                    
                    onMessage(messaging, (payload) => {
                        console.log('Foreground message received.', payload);
                        toast({
                            title: payload.notification?.title,
                            description: payload.notification?.body,
                        });
                    });

                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            } else {
                console.log('Unable to get permission to notify.');
            }
        } catch (error) {
            console.error('An error occurred while retrieving token. ', error);
        }
    };

    useEffect(() => {
        // Only run this for admins once they are logged in.
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && user && isAdmin) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then((registration) => {
                    console.log('Service Worker registration successful, scope is:', registration.scope);
                    requestPermission();
                }).catch((err) => {
                    console.error('Service Worker registration failed:', err);
                });
        }
    }, [user, isAdmin]);
};
