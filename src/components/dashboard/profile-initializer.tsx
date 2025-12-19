
'use client';

import { useUser } from '@/firebase';
import { useUserData } from '@/hooks/use-user-data';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef } from 'react';
import { createUserProfile } from '@/app/(app)/dashboard/actions';
import { toast } from '@/hooks/use-toast';

/**
 * A client component that handles the one-time creation of a user profile
 * when a new user signs up with a referral code. It runs in the background
 * on the dashboard and does not render any UI.
 */
export function ProfileInitializer() {
  const { user } = useUser();
  const { userData, loading: userDataLoading } = useUserData();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('referralCode');
  
  // Use a ref to ensure the creation logic only runs once
  const profileCreationAttempted = useRef(false);

  useEffect(() => {
    // Conditions to attempt profile creation:
    // 1. We have a user object.
    // 2. We have a referral code from the URL.
    // 3. The user's data has finished loading and is confirmed to be missing (null).
    // 4. We haven't already attempted to create a profile in this session.
    if (user && referralCode && !userData && !userDataLoading && !profileCreationAttempted.current) {
      // Mark that we are attempting to create a profile to prevent re-runs
      profileCreationAttempted.current = true;

      toast({
        title: 'Finalizing Account Setup',
        description: 'Please wait while we create your user profile...',
      });

      const handleProfileCreation = async () => {
        try {
          const result = await createUserProfile(user.uid, user.email!, referralCode);
          if (result.success) {
            toast({
              title: 'Account Ready!',
              description: 'Your profile has been created successfully. Welcome!',
            });
            // The useUserData hook will automatically refetch the data upon creation,
            // which will then render the full dashboard.
          } else {
            toast({
              variant: 'destructive',
              title: 'Profile Creation Failed',
              description: result.error || 'An unknown server error occurred.',
            });
          }
        } catch (e: any) {
          toast({
            variant: 'destructive',
            title: 'Profile Creation Error',
            description: 'A client-side error occurred. Please try logging out and back in.',
          });
        }
      };

      handleProfileCreation();
    }
  }, [user, userData, userDataLoading, referralCode]);

  // This component does not render anything
  return null;
}
