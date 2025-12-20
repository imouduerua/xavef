'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  // Memoize the query to prevent re-running the effect on every render
  const memoizedQuery = useMemo(() => query, [query]);

  useEffect(() => {
    if (!memoizedQuery) {
      setData(null);
      setLoading(false);
      setError(null);
      setIndexCreationUrl(null);
      return;
    }

    // Reset state on new query
    setLoading(true);
    setError(null);
    setIndexCreationUrl(null);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot: QuerySnapshot<T>) => {
        const resultData = snapshot.docs.map((doc) => {
             const docData = doc.data();
             // Attempt to get userId from path if not in data
             const pathParts = doc.ref.path.split('/');
             const hasUserId = pathParts.includes('users') && pathParts.indexOf('users') + 1 < pathParts.length;
             const userId = hasUserId ? pathParts[pathParts.indexOf('users') + 1] : undefined;

            return {
                id: doc.id,
                ...docData,
                // Add userId if it's not already in the document data
                ...(userId && !(docData as any).userId && { userId: userId }),
            } as T;
        });
        setData(resultData);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('Error fetching collection:', err);

        // Check for the specific "missing index" error
        if (err.code === 'failed-precondition' && err.message.includes('requires an index')) {
          const urlMatch = err.message.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            setIndexCreationUrl(urlMatch[0]);
          }
        }
        
        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, loading, error, indexCreationUrl };
}
