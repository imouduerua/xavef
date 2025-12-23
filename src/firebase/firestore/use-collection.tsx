'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo, useRef } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// Helper function to compare if two queries are equivalent
function areQueriesEqual(q1: Query | null, q2: Query | null): boolean {
  if (!q1 || !q2) return q1 === q2;
  // This is a simplified check. A robust implementation would deeply compare all query parameters.
  // For this app, comparing canonical path and filters as strings is sufficient.
  try {
    const q1String = q1.toString();
    const q2String = q2.toString();
    return q1String === q2String;
  } catch (e) {
    return false;
  }
}

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  // Use a ref to store the previous query to compare against the new one.
  const prevQueryRef = useRef<Query | null>(null);

  useEffect(() => {
    // If the query is null or hasn't changed, do nothing.
    if (areQueriesEqual(query, prevQueryRef.current)) {
      return;
    }
    
    prevQueryRef.current = query;
    
    // If the new query is null, reset the state and do not create a listener.
    if (!query) {
      setData(null);
      setLoading(false); // Not loading if there's no query
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
            // Path can be retrieved from the query object for creating contextual errors
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
    
    // Cleanup function to unsubscribe from the listener when the component unmounts or query changes.
    return () => unsubscribe();
  }, [query]); // The effect now depends directly on the query prop.

  return { data, loading, error, indexCreationUrl };
}
