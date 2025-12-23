
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
  
  // Use a ref to store the unsubscribe function to prevent re-subscribing on every render
  const unsubscribeRef = useRef<() => void>();

  useEffect(() => {
    // Definitive fix: If the query is not valid, do not proceed.
    // Reset the state and clean up any existing listener.
    if (!query) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      setData(null);
      setLoading(true); // Reset to loading if query becomes null
      setError(null);
      setIndexCreationUrl(null);
      return;
    }

    setLoading(true);
    setError(null);
    setIndexCreationUrl(null);

    // Set up the new snapshot listener
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
            // Path can be retrieved from the query object for creating contextual errors
            // This is fragile and accesses a private property. Let's be safe.
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
    
    // Store the new unsubscribe function in the ref.
    unsubscribeRef.current = unsubscribe;

    // The cleanup function for when the component unmounts or query changes.
    return () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }
    };
    // The query object itself is the dependency. A new query should trigger a new subscription.
  }, [query]);

  return { data, loading, error, indexCreationUrl };
}
