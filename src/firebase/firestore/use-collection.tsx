
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
  DocumentReference,
  DocumentSnapshot,
  getFirestore,
  getApp,
  getApps,
  initializeApp,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { firebaseConfig } from '../config';

// This ensures Firebase is initialized only once, and returns a stable firestore instance.
const getStableFirestore = () => {
    if (getApps().length === 0) {
        return getFirestore(initializeApp(firebaseConfig));
    } else {
        return getFirestore(getApp());
    }
};
const firestore = getStableFirestore();

// Creates a stable key from a query object without stringifying it.
const getQueryKey = (q: Query | DocumentReference | null) => {
    if (!q) return null;
    return `${q.path}_${(q as any)._query?.canonicalId() || 'doc'}`;
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
        console.error(`[useCollection] Error fetching collection at ${query.path}:`, err.message);

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
        console.error(`[useDoc] Error fetching document at ${ref.path}:`, err);
        setError(err);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docKey]);

  return { data, loading, error };
}

    