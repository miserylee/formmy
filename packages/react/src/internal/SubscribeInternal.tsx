import { type ReactNode, useEffect, useReducer } from 'react';

import { type IFormApi } from '@formmy/core';

export interface SubscribeInternalProps<T> {
  formApi: IFormApi<T>;
  children: (formApi: IFormApi<T>) => ReactNode;
}

export function SubscribeInternal<T>({ children, formApi }: SubscribeInternalProps<T>): JSX.Element {
  const [, reload] = useReducer((p) => p + 1, 0);

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
