
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

// Helper function to compare if two queries are equivalent
function areQueriesEqual(q1: Query | null, q2: Query | null): boolean {
  if (!q1 && !q2) return true;
  if (!q1 || !q2) return false;
  return q1.toString() === q2.toString();
}

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  const queryRef = useRef<Query | null>(null);

  useEffect(() => {
    // If query is the same as the one we're already listening to, do nothing.
    if (areQueriesEqual(query, queryRef.current)) {
      return;
    }
    queryRef.current = query;

    // If the query is null, reset the state and ensure no listener is active.
    if (!query) {
      setData(null);
      setLoading(true); // Set to true because we are effectively "loading" a new state (of no data)
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
    
    return () => unsubscribe();
  }, [query]);

  return { data, loading, error, indexCreationUrl };
}
