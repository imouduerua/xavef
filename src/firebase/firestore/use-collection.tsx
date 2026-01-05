
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

// This function creates a stable string representation of a query for use in dependency arrays.
const getQueryKey = (q: Query | DocumentReference | null): string | null => {
    if (!q) return null;
    if ('_query' in q) { // It's a Query
      const queryObj = q as any;
      if (typeof queryObj._query?.canonicalId === 'function') {
        return queryObj._query.canonicalId();
      }
    }
    // For a DocumentReference, the path is a stable unique identifier.
    return q.path;
}

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  const queryKey = getQueryKey(query);

  useEffect(() => {
    // If the query is null, it means we are not ready to fetch yet.
    // Return early and keep the loading state.
    if (!query) {
      setLoading(true);
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
        console.error(`[useCollection] Error fetching collection:`, err.message);

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

    return () => unsubscribe();
  }, [queryKey]); // The key is stable and safe for dependency array

  return { data, loading, error, indexCreationUrl };
}

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const docKey = getQueryKey(ref);

  useEffect(() => {
    // If the ref is null, it means we are not ready to fetch yet.
    if (!ref) {
      setLoading(true);
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        if (snapshot.exists()) {
          setData({ ...snapshot.data(), id: snapshot.id, path: snapshot.ref.path } as T & { id: string; path: string });
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error(`[useDoc] Error fetching document:`, err);
        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docKey]); // The key is stable and safe for dependency array

  return { data, loading, error };
}

    