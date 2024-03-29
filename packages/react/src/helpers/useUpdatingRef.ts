import { type MutableRefObject, useRef } from 'react';

/**
 * 将传入值转换为静态 ref，用于在其他 hooks 中使用外部值，但不期望其被声明到 deps 时的场景
 * @param value
 */
export function useUpdatingRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
