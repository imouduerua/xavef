
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
  
  // Use a ref to track the query and prevent re-running the effect on every render
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    // If the query is not valid, do not proceed.
    // Reset the state and wait for a valid query.
    if (!query) {
      setData(null);
      setLoading(true); 
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
        // Ensure we are only setting state for the current query.
        if (queryRef.current === query) {
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
        }
      },
      (err: FirestoreError) => {
        // Ensure we are only setting state for the current query.
         if (queryRef.current !== query) {
            return;
        }

        console.error('Error fetching collection:', err);

        if (err.code === 'failed-precondition' && err.message.includes('requires an index')) {
          const urlMatch = err.message.match(/https?:\/\/console\.firebase\.google\.com\S+/);
          if (urlMatch) {
            setIndexCreationUrl(urlMatch[0]);
          }
        } else if (err.code === 'permission-denied') {
            // Path can be retrieved from the query object for creating contextual errors
            const path = (query as any)._query?.path?.canonical;
            
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
    // The calling component MUST memoize the query to prevent infinite loops.
  }, [query]);

  return { data, loading, error, indexCreationUrl };
}
