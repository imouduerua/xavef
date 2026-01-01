
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// Helper to create a stable key from a query
const getQueryKey = (query: Query<any>): string => {
  if (!query) return 'null';
  const q = (query as any)._query;
  const path = q.path.segments.join('/');
  
  const constraints = (q.constraints || []).map((c: any) => {
    let value = c.value;
    // If the value is a Firestore Timestamp, convert it to a stable string.
    if (value instanceof Timestamp) {
      value = value.toDate().toISOString();
    } else if (typeof value === 'object' && value !== null) {
      // For other objects, a simple JSON stringify is a fallback.
      // This is not perfect for all cases but better than [object Object].
      try {
        value = JSON.stringify(value);
      } catch (e) {
        value = '[Unserializable Object]';
      }
    }
    return `${c.type}-${c.field?.canonicalName}-${value}`;
  }).join(',');

  return `${path}|${constraints}`;
}


export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);
  
  const queryKey = useMemo(() => query ? getQueryKey(query) : 'null', [query]);

  useEffect(() => {
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
        } as T));
        
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
        } else if (err.code === 'permission-denied') {
          let queryPathStr = 'unknown path';
           try {
             // This is an attempt to get the path, it might not always be available.
             queryPathStr = (query as any)._query.path.segments.join('/');
           } catch {}
          
          const permissionError = new FirestorePermissionError({
              path: queryPathStr,
              operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
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
