'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  useEffect(() => {
    // If the query is not ready, reset state and don't create a listener.
    // This is the critical fix.
    if (!query) {
      setData(null);
      setLoading(true); // Set to true as we are "waiting" for a valid query
      setError(null);
      setIndexCreationUrl(null);
      return;
    }

    setLoading(true);
    setError(null);
    setIndexCreationUrl(null);
    
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const resultData = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return {
                id: doc.id,
                path: doc.ref.path,
                ...docData,
            } as T;
        });
        setData(resultData);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('Error fetching collection:', err);

        if (err.code === 'failed-precondition' && err.message.includes('requires an index')) {
          const urlMatch = err.message.match(/https?:\/\/console\.firebase\.google\.com\S+/);
          if (urlMatch) {
            setIndexCreationUrl(urlMatch[0]);
          }
        } else if (err.code === 'permission-denied') {
            const path = (query as any)?._query?.path?.canonical;
            
            if (path) {
                const permissionError = new FirestorePermissionError({
                    path: path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                 console.error("Permission denied on a query where the path could not be determined.");
            }
        }
        
        setError(err);
        setData(null);
        setLoading(false);
      }
    );
    
    // Cleanup function to unsubscribe from the listener when the component unmounts or query changes.
    return () => unsubscribe();
  }, [query]);

  return { data, loading, error, indexCreationUrl };
}
