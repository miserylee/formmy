import { type ReactNode } from 'react';

import { FormContext } from './FormContext';
import { type FormBridge, type FormBridgeRefType, useFormBridgeRef } from './internal/useFormBridgeRef';

export { type FormBridge, type FormBridgeRefType };

export function useFormBridge<T>(): FormBridge<T> {
  const ref = useFormBridgeRef<T>();
  return {
    ref,
    renderFormExt: (children: ReactNode) => {
      if (!ref.current) {
        return null;
      }
      return <FormContext.Provider value={ref.current}>{children}</FormContext.Provider>;
    },
  };
}
