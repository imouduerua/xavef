
import { UserDataContext } from '@/context/user-data-provider';
import { useContext } from 'react';

export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
