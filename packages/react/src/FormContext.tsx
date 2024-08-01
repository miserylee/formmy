import { createContext } from 'react';

import { type IFormApi } from '@formmy/core';

export const FormContext = createContext<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formApi?: IFormApi<any>;
}>({});
