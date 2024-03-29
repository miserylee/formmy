import { useContext, useMemo } from 'react';
import { FormContext } from './FormContext';
import { DeepKeys, IFieldApi } from '@formmy/core';

export function useField<T, Key extends DeepKeys<T>>(key: Key): IFieldApi<T, Key> {
  const context = useContext(FormContext);
  if (!context.formApi) {
    throw new Error('should call useField in context of Form');
  }
  const { formApi } = context;
  return useMemo(() => formApi.getField(key), [key, formApi]);
}
