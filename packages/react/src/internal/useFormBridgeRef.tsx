import { type MutableRefObject, type ReactElement, type ReactNode, useMemo, useReducer } from 'react';

import { type IFormApi } from '@formmy/core';

export type FormBridgeRefType<T> = MutableRefObject<IFormApi<T> | null> &
  ((formApi: IFormApi<T> | null) => void);

export interface FormBridge<T> {
  ref: FormBridgeRefType<T>;
  renderFormExt: (children: ReactNode) => ReactElement | null;
}

export function useFormBridgeRef<T>(): FormBridgeRefType<T> {
  const [, reload] = useReducer((p) => p + 1, 0);
  return useMemo(() => {
    const fn: FormBridgeRefType<T> = (formApi: IFormApi<T> | null) => {
      fn.current = formApi;
      // trigger renderFormExt
      reload();
    };
    fn.current = null as IFormApi<T> | null;
    return fn;
  }, []);
}
