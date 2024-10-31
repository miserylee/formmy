import { type ReactElement, type ReactNode, type RefObject, useState } from 'react';

import { type IFormApi } from '@formmy/core';

import { FormContext } from './FormContext';

export interface FormBridge<T> {
  ref: RefObject<IFormApi<T>> & ((formApi: IFormApi<T> | null) => void);
  renderFormExt: (children: ReactNode) => ReactElement | null;
}

export function useFormBridge<T>(): FormBridge<T> {
  const [formApi, setFormApi] = useState<IFormApi<T> | null>(null);
  const ref = Object.assign(setFormApi, { current: formApi });
  return {
    ref,
    renderFormExt: (children: ReactNode) => {
      if (!formApi) {
        return null;
      }
      return <FormContext.Provider value={{ formApi }}>{children}</FormContext.Provider>;
    },
  };
}
