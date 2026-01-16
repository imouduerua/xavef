
'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { useFirebaseApp, useUser } from '@/firebase/provider';
import { useEffect } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/use-admin';

// IMPORTANT: You need to generate this key in your Firebase project settings
// under Cloud Messaging > Web configuration.
const VAPID_KEY = 'YOUR_VAPID_PUBLIC_KEY'; 

export const FCMInitializer = () => {
    const app = useFirebaseApp();
    const { user } = useUser();
    const firestore = useFirestore();
    const { isAdmin } = useAdmin();

    useEffect(() => {
        if (typeof window === 'undefined' || !app || !user || !firestore || !isAdmin) {
            return;
        }

        if (VAPID_KEY === 'YOUR_VAPID_PUBLIC_KEY') {
            console.warn('FCM VAPID key not set. Push notifications will not work.');
            return;
        }

        const setupFCM = async () => {
            try {
                const supported = await isSupported();
                if (!supported) {
                    console.log('Firebase Messaging is not supported in this browser.');
                    return;
                }
                
                // We only request permission if it's not already granted.
                if (Notification.permission === 'default') {
                    await Notification.requestPermission();
                }

                if (Notification.permission !== 'granted') {
                    console.log('Notification permission was not granted.');
                    return;
                }

                const messaging = getMessaging(app);
                const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });

                if (fcmToken) {
                    const tokenRef = doc(firestore, 'fcmTokens', user.uid);
                    await setDoc(tokenRef, {
                        userId: user.uid,
                        token: fcmToken,
                        updatedAt: serverTimestamp(),
                    }, { merge: true });
                } else {
                     console.log('No registration token available. Request permission to generate one.');
                }

            } catch (err: any) {
                console.error('An error occurred while setting up FCM: ', err);
                if (err.code === 'messaging/missing-fcm-sw-script') {
                    toast({
                        variant: 'destructive',
                        title: 'Push Notification Setup Failed',
                        description: 'Could not find the Firebase Messaging service worker. Please ensure `firebase-messaging-sw.js` is in your `public` folder.',
                        duration: 10000,
                    });
                } else {
                     toast({
                        variant: 'destructive',
                        title: 'Push Notification Error',
                        description: 'An error occurred while retrieving the notification token.',
                    });
                }
            }
        };

        setupFCM();

    }, [app, user, firestore, isAdmin]);

    return null; // This component doesn't render anything.
};
