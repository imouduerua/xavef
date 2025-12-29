
'use client';

import {
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// A stable string representation of the query is needed for useEffect dependencies.
// This function safely extracts the necessary parts of the query.
const getQueryKey = (query: Query<any> | null): string | null => {
  if (!query) return null;
  const q = query as any;
  // This is a simplified but more stable approach than accessing private _query properties.
  const path = (q._query?.path?.segments || []).join('/');
  
  const constraints = (q._query?.constraints || []).map((c: any) => {
    // Attempt to serialize values, handling common types.
    let valueStr = '';
    if (c.value) {
        try {
            valueStr = JSON.stringify(c.value);
        } catch {
            valueStr = String(c.value);
        }
    }
    return `${c.type}-${c._field?.canonical || ''}-${c._op || ''}-${valueStr}`;
  }).join(',');

  return `${path}?${constraints}`;
}


export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);
  
  // Create a stable key from the query to use in the dependency array.
  const queryKey = useMemo(() => getQueryKey(query), [query]);

  useEffect(() => {
    if (!queryKey || !query) {
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
  // Use the stable queryKey as the dependency.
  }, [queryKey, query]); 

  return { data, loading, error, indexCreationUrl };
}
