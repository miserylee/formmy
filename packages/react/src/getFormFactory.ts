import { type ForwardedRef, type PropsWithChildren, type ReactElement } from 'react';

import { type DeepKeys, type IFieldApi, type IFormApi } from '@formmy/core';

import { Action, type ActionProps } from './Action';
import { Field, type FieldProps } from './Field';
import { Form, type FormProps } from './Form';
import { useField } from './useField';
import { useForm } from './useForm';

export function getFormFactory<T>(): {
  Form: (props: PropsWithChildren<FormProps<T>> & { ref?: ForwardedRef<IFormApi<T>> }) => ReactElement;
  Field: <Key extends DeepKeys<T>>(props: FieldProps<T, Key>) => ReactElement;
  Action: (props: ActionProps<T>) => ReactElement;
  useForm: () => IFormApi<T>;
  useField: <Key extends DeepKeys<T>>(key: Key) => IFieldApi<T, Key>;
} {
  return {
    Form: Form<T>,
    Field: Field,
    Action: Action<T>,
    useForm: useForm<T>,
    useField: useField,
  };
}
