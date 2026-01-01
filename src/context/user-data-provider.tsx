
'use client';

import { useDoc, useFirestore, useUser } from '@/firebase';
import { UserData } from '@/lib/types';
import { doc } from 'firebase/firestore';
import React, { createContext, useMemo } from 'react';

type UserDataContextType = {
  userData: UserData | null;
  loading: boolean;
};

export const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user?.uid, firestore]);

  const { data: userData, loading: docLoading } = useDoc<UserData>(userDocRef);

  const loading = userLoading || (user && !userData && docLoading);

  const value = useMemo(() => ({ userData, loading }), [userData, loading]);

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}
