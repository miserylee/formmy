import { useRef } from 'react';

import type { DeepKeys } from '@formmy/core';

export function useMemoDeps<T>(deps: DeepKeys<T>[]): Set<DeepKeys<T>> {
  const prevRef = useRef(new Set(deps));
  const prev = prevRef.current;
  const current = new Set(deps);
  const isChanged = prev.size !== current.size || [...prev].some((dep) => !current.has(dep));
  if (isChanged) {
    prevRef.current = current;
    return current;
  }
  return prev;
}
