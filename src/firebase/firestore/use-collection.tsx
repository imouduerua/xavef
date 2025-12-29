
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
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// A stable string representation of the query is needed for useEffect dependencies.
// This function safely extracts the necessary parts of the query.
const getQueryKey = (query: Query<any>): string => {
  const q = query as any;
  // Access public properties or methods if available.
  // This is a simplified but more stable approach than accessing private _query properties.
  const path = q.path || (q._query?.path?.segments || []).join('/');
  
  const constraints = (q._query?.constraints || []).map((c: any) => {
    return `${c.type}-${c.field?.segments?.join('.') || ''}-${c.op || ''}-${c.value || ''}`;
  }).join(',');

  return `${path}?${constraints}`;
}


export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);
  
  // Create a stable key from the query to use in the dependency array.
  const queryKey = query ? getQueryKey(query) : null;

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
             queryPathStr = (query as any)._query.path.canonical;
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
  }, [queryKey]); 

  return { data, loading, error, indexCreationUrl };
}
