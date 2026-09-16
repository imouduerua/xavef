
'use client';

import * as React from 'react';
import type { Query, DocumentReference } from 'firebase/firestore';

// Helper function to compare arrays of dependencies
function depsAreEqual(a: readonly any[], b: readonly any[]) {
  if (a.length !== b.length) return false;
  return a.every((dep, i) => dep === b[i]);
}

/**
 * Custom hook to memoize Firebase queries and document references.
 * This prevents re-creating them on every render, which can cause infinite loops
 * with hooks like `useCollection` or `useDoc`.
 * @param factory A function that returns a Firestore Query or DocumentReference.
 * @param deps The dependency array for the factory function.
 * @returns The memoized Query or DocumentReference.
 */
export function useMemoFirebase<T extends Query | DocumentReference | null>(
  factory: () => T,
  deps: readonly any[]
): T {
  // We use a ref to store the memoized value and its dependencies
  const ref = React.useRef<{
    deps: readonly any[];
    value: T;
  }>();
  
  // If the ref is not initialized or deps have changed, re-create the value
  if (ref.current === undefined || !depsAreEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }
  
  // Return the memoized value
  return ref.current.value;
}
