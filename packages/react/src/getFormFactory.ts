import { type ForwardedRef, type PropsWithChildren, type ReactElement } from 'react';

import { type DeepKeys, type IFieldApi, type IFormApi } from '@formmy/core';

import { Field, type FieldProps } from './Field';
import { Form, type FormProps } from './Form';
import { Subscribe, type SubscribeProps } from './Subscribe';
import { useField } from './useField';
import { useForm } from './useForm';

export function getFormFactory<T>(): {
  Form: (props: PropsWithChildren<FormProps<T>> & { ref?: ForwardedRef<IFormApi<T>> }) => ReactElement;
  Field: <Key extends DeepKeys<T>>(props: FieldProps<T, Key>) => ReactElement;
  Subscribe: (props: SubscribeProps<T>) => ReactElement;
  useForm: () => IFormApi<T>;
  useField: <Key extends DeepKeys<T>>(key: Key) => IFieldApi<T, Key>;
} {
  return {
    Form: Form<T>,
    Field: Field,
    Subscribe: Subscribe<T>,
    useForm: useForm<T>,
    useField: useField,
  };
}
