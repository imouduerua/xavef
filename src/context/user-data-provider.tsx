
'use client';

import { useDoc, useFirestore, useUser } from '@/firebase';
import { UserData } from '@/lib/types';
import { doc } from 'firebase/firestore';
import React, { createContext } from 'react';

type UserDataContextType = {
  userData: UserData | null;
  loading: boolean;
};

export const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = React.useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData, loading } = useDoc<UserData>(userDocRef);

  return (
    <UserDataContext.Provider value={{ userData, loading }}>
      {children}
    </UserDataContext.Provider>
  );
}
