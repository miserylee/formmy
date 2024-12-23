import { type MutableRefObject, type ReactElement, type ReactNode, useMemo, useReducer } from 'react';

import { type IFormApi } from '@formmy/core';

import { FormContext } from './FormContext';

export type FormBridgeRefType<T> = MutableRefObject<IFormApi<T> | null> &
  ((formApi: IFormApi<T> | null) => void);

export interface FormBridge<T> {
  ref: FormBridgeRefType<T>;
  renderFormExt: (children: ReactNode) => ReactElement | null;
}

export function useFormBridge<T>(): FormBridge<T> {
  const [, reload] = useReducer((p) => p + 1, 0);
  const ref = useMemo(() => {
    const fn: FormBridgeRefType<T> = (formApi: IFormApi<T> | null) => {
      fn.current = formApi;
      // trigger renderFormExt
      reload();
    };
    fn.current = null as IFormApi<T> | null;
    return fn;
  }, []);
  return {
    ref,
    renderFormExt: (children: ReactNode) => {
      if (!ref.current) {
        return null;
      }
      return <FormContext.Provider value={{ formApi: ref.current }}>{children}</FormContext.Provider>;
    },
  };
}
