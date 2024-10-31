import { type ReactElement, type ReactNode, useEffect, useReducer } from 'react';

import { type IFormApi } from '@formmy/core';

import { useForm } from './useForm';

export interface SubscribeProps<T> {
  children: (formApi: IFormApi<T>) => ReactNode;
}

export function Subscribe<T>({ children }: SubscribeProps<T>): ReactElement {
  const [, reload] = useReducer((p) => p + 1, 0);

  const formApi = useForm<T>();

  useEffect(() => {
    if (!formApi) {
      return;
    }
    const unsubValues = formApi.subscribe('values', {
      listener: reload,
    });
    const unsubErrors = formApi.subscribe('errors', {
      listener: reload,
    });
    return () => {
      unsubValues();
      unsubErrors();
    };
  }, [formApi]);

  return <>{children(formApi)}</>;
}
