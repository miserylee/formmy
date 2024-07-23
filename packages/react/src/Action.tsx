import { ReactElement, ReactNode } from 'react';
import { IFormApi } from '@formmy/core';
import { useForm } from './useForm';

export interface ActionProps<T> {
  children: (formApi: IFormApi<T>) => ReactNode;
}

export function Action<T>({ children }: ActionProps<T>): ReactElement {
  const formApi = useForm<T>();

  return <>{children(formApi)}</>;
}
