import { createContext } from 'react';

import { type IFormApi } from '@formmy/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FormContext = createContext<IFormApi<any> | undefined>(undefined);

export function createFormContext(): typeof FormContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createContext<IFormApi<any> | undefined>(undefined);
}
