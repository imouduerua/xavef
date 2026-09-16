
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
  DocumentReference,
  DocumentSnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const { user, loading: authLoading } = useUser();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  useEffect(() => {
    // Don't run the query if auth is loading, the user is null, or the query is null
    if (authLoading || !user || !query) {
      setLoading(false);
      setData(null);
      return;
    }
    
    setLoading(true);
    setIndexCreationUrl(null);
    setError(null);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const resultData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          path: doc.ref.path,
        } as T & { id: string; path: string; }));
        
        setData(resultData);
        setLoading(false);
      },
      (err: FirestoreError) => {
        if (user) { // Only process errors if the user is still logged in.
          let handledAsIndexError = false;
          if (err.code === 'failed-precondition') {
            const urlMatch = err.message.match(/https?:\/\/console\.firebase\.google\.com\S+/);
            if (urlMatch) {
              setIndexCreationUrl(urlMatch[0]);
              handledAsIndexError = true;
            }
          }
          
          if (!handledAsIndexError) {
            // For all other errors, or if we couldn't parse the URL
            console.error(`[useCollection] Error fetching collection:`, err);
          }
          setError(err);
        }
        
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, user, authLoading]);

  return { data, loading, error, indexCreationUrl };
}

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const { user, loading: authLoading } = useUser();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  useEffect(() => {
    if (authLoading || !user || !ref) {
      setLoading(false);
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        if (snapshot.exists()) {
          const resultData = { ...snapshot.data(), id: snapshot.id, path: snapshot.ref.path } as T & { id: string; path: string };
           setData(resultData);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
         if (user) {
            console.error(`[useDoc] Error fetching document:`, err);
            setError(err);
         }
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, user, authLoading]);

  return { data, loading, error };
}
