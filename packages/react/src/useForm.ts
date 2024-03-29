import { useContext } from 'react';
import { FormContext } from './FormContext';
import { IFormApi } from '@formmy/core';

export function useForm<T>(): IFormApi<T> {
  const context = useContext(FormContext);
  if (!context.formApi) {
    throw new Error('should call useForm in context of Form');
  }
  return context.formApi as IFormApi<T>;
}
