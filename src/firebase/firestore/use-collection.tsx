
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
import { useEffect, useState, useMemo } from 'react';

// This function creates a stable string representation of a query for use in dependency arrays.
const getQueryKey = (q: Query | DocumentReference | null): string | null => {
    if (!q) return null;
    // The canonicalId is a stable, unique string representation of the query's constraints.
    if ('_query' in q) { // It's a Query
      const queryObj = q as any;
      return queryObj._query.canonicalId();
    }
    // For a DocumentReference, the path is a stable unique identifier.
    return q.path;
}

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  const queryKey = useMemo(() => getQueryKey(query), [query]);

  useEffect(() => {
    if (!queryKey || !query) {
      setLoading(false);
      setData([]);
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
  // We use queryKey which is a stable string representation of the query.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]); 

  return { data, loading, error, indexCreationUrl };
}

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const docKey = useMemo(() => getQueryKey(ref), [ref]);

  useEffect(() => {
    if (!docKey || !ref) {
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
    // We use docKey which is a stable string representation of the doc path.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  return { data, loading, error };
}
