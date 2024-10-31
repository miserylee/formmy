import { type ReactElement, type ReactNode, useState } from 'react';

import { type IFormApi } from '@formmy/core';

import { FormContext } from './FormContext';

export interface FormBridge<T> {
  ref: (formApi: IFormApi<T> | null) => void;
  renderFormExt: (children: ReactNode) => ReactElement | null;
}

export function useFormBridge<T>(): FormBridge<T> {
  const [formApi, setFormApi] = useState<IFormApi<T> | null>(null);
  return {
    ref: setFormApi,
    renderFormExt: (children: ReactNode) => {
      if (!formApi) {
        return null;
      }
      return <FormContext.Provider value={{ formApi }}>{children}</FormContext.Provider>;
    },
  };
}
