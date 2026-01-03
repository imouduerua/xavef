
'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import React, from 'react';
import { useAuth as useFirebaseAuth } from '@/firebase';

interface AuthContextType {
  user: User | null;
  uid: string | null;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  uid: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const value = React.useMemo(() => ({
    user,
    uid: user?.uid ?? null,
    loading,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
