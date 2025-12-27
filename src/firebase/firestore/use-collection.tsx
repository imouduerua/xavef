
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  // Using a ref to track the query string representation to avoid re-running the effect
  // for queries that are structurally identical but different object references.
  const queryJson = query ? JSON.stringify((query as any)._query) : null;

  useEffect(() => {
    // If the query is null, it means we don't have enough information to fetch data yet.
    // Reset state and wait for a valid query.
    if (!query) {
      setData(null);
      setLoading(false); // Not loading if there's no query
      setError(null);
      setIndexCreationUrl(null);
      return; // Stop here and wait for the next effect run with a valid query.
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
                 // This fallback prevents the app from crashing if the path is not found.
                 console.error("Permission denied on a query where the path could not be determined.");
            }
        }
        
        setError(err);
        setData(null);
        setLoading(false);
      }
    );
    
    // Cleanup function that runs when the component unmounts or the query changes.
    return () => unsubscribe();
  }, [queryJson]); // Effect dependencies: only re-run if the query itself changes.

  return { data, loading, error, indexCreationUrl };
}
