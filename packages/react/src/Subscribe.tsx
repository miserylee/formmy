import { type ReactElement, type ReactNode } from 'react';

import { type IFormApi } from '@formmy/core';

import { SubscribeInternal } from './internal/SubscribeInternal';
import { useForm } from './useForm';

export interface SubscribeProps<T> {
  children: (formApi: IFormApi<T>) => ReactNode;
}

export function Subscribe<T>({ children }: SubscribeProps<T>): ReactElement {
  const formApi = useForm<T>();
  return <SubscribeInternal formApi={formApi}>{children}</SubscribeInternal>;
}
