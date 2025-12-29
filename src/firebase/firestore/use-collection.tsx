
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

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  const queryKey = useMemo(() => {
    if (!query) return null;
    // A simplified key generation. This might not be perfect for all complex queries,
    // but is more stable than stringifying the whole object.
    const q = query as any;
    try {
      const path = q._query.path.segments.join('/');
      const constraints = (q._query.explicitOrderBy || []).map((c: any) => `${c.field.segments.join('.')}:${c.dir}`).join(',');
      return `${path}|${constraints}`;
    } catch {
       return String(query);
    }
  }, [query]);

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
  }, [queryKey, query]);

  return { data, loading, error, indexCreationUrl };
}
