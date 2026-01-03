
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
  queryEqual,
} from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';

// This hook is designed to be stable even if the query object reference changes on every render.
// It uses a ref to store the previous query and only re-subscribes if the new query is different.
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  const queryRef = useRef<Query<T> | null>(query);

  useEffect(() => {
    // If the query object itself is the same or if they are deeply equal, do nothing.
    // This is the core of the stability fix.
    if (queryRef.current === query || (queryRef.current && query && queryEqual(queryRef.current, query))) {
      return;
    }
    
    // Update the ref to the new query for the next render cycle.
    queryRef.current = query;

    if (!query) {
      setData(null);
      setLoading(false);
      setError(null);
      setIndexCreationUrl(null);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const resultData = snapshot.docs.map((doc) => ({
          id: doc.id,
          path: doc.ref.path,
          ...doc.data(),
        } as T & { id: string; path: string; }));
        
        setData(resultData);
        setLoading(false);
        setError(null);
        setIndexCreationUrl(null);
      },
      (err: FirestoreError) => {
        console.error('Error fetching collection:', err);

        if (
          err.code === 'failed-precondition' &&
          err.message.includes('requires an index')
        ) {
          const urlMatch = err.message.match(
            /https?:\/\/console\.firebase\.google\.com\S+/
          );
          if (urlMatch) {
            setIndexCreationUrl(urlMatch[0]);
          }
        }
        
        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    // The cleanup function will be called when the component unmounts
    // or when the dependencies of the useEffect hook change.
    return () => unsubscribe();
  }, [query]); // The dependency is the query itself, but the logic inside prevents re-running if it's deeply equal.

  return { data, loading, error, indexCreationUrl };
}
