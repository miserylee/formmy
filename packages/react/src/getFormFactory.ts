import { Form } from './Form';
import { Field, FieldProps } from './Field';
import { DeepKeys, IFieldApi } from '@formmy/core';
import { ReactElement } from 'react';
import { useForm } from './useForm';
import { useField } from './useField';

export function getFormFactory<T>() {
  return {
    Form: Form<T>,
    Field: Field as <Key extends DeepKeys<T>>(props: FieldProps<T, Key>) => ReactElement,
    useForm: useForm<T>,
    useField: useField as <Key extends DeepKeys<T>>(key: Key) => IFieldApi<T, Key>,
  };
}
