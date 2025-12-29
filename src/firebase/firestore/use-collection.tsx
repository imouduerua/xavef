
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

// Helper to create a stable key from a query's properties
const getQueryKey = (q: Query | null): string | null => {
  if (!q) return null;
  // Access the internal _query property which contains the query's definition
  const queryInternals = (q as any)._query;
  if (!queryInternals) return null;

  try {
    const path = queryInternals.path?.canonical || '';
    
    const filters = queryInternals.filters?.map((f: any) => {
        const fieldPath = f.field?.canonical || '';
        const op = f.op || '';
        // Safely stringify value, handling potential circular references
        const value = JSON.stringify(f.value, (key, val) => {
            if (val && typeof val === 'object' && val.toDate) {
                return val.toDate().toISOString();
            }
            if (val && typeof val === 'object' && key === 'firestore') {
              return '[FirestoreInstance]';
            }
            return val;
        });
        return `${fieldPath}${op}${value}`;
    }).join(',') || '';

    const limit = queryInternals.limit !== undefined ? `limit:${queryInternals.limit}` : '';
    const limitToLast = queryInternals.limitToLast !== undefined ? `limitToLast:${queryInternals.limitToLast}`: '';
    
    const orderBy = queryInternals.explicitOrderBy?.map((o: any) => `${o.field.canonical}${o.dir}`).join(',') || '';

    return `${path}|${filters}|${limit}|${limitToLast}|${orderBy}`;
  } catch (e) {
      console.error("Failed to generate query key", e);
      // Fallback to a less stable, but safer key if complex stringification fails
      return queryInternals.path?.canonical || Date.now().toString();
  }
}


export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  // Generate a stable key representing the query.
  const queryKey = useMemo(() => getQueryKey(query), [query]);

  useEffect(() => {
    // This now correctly depends on queryKey. If query is null, key is null, and we do nothing.
    if (!queryKey) {
      setData(null);
      setLoading(false);
      setError(null);
      setIndexCreationUrl(null);
      return;
    }
    
    // The query object itself is needed for onSnapshot
    if (!query) return;

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
            const path = (query as any)?._query?.path?.canonical;
            
            if (path) {
                const permissionError = new FirestorePermissionError({
                    path: path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            }
        }
        
        setError(err);
        setData(null);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  // The effect now depends on the stable queryKey, preventing infinite loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  return { data, loading, error, indexCreationUrl };
}
