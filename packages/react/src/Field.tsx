import { type ReactElement, type ReactNode } from 'react';

import { type DeepKeys, type FormValidator, type IFieldApi } from '@formmy/core';

import { FieldInternal } from './internal/FieldInternal';
import { useField } from './useField';

export interface FieldProps<T, Key extends DeepKeys<T>> {
  fieldKey: Key;
  deps?: DeepKeys<T>[];
  children: (fieldApi: IFieldApi<T, Key>) => ReactNode;
  validators?: FormValidator<T, Key> | FormValidator<T, Key>[];
}

export function Field<T, Key extends DeepKeys<T>>({
  fieldKey,
  children,
  ...props
}: FieldProps<T, Key>): ReactElement {
  const fieldApi = useField<T, Key>(fieldKey);

  return (
    <FieldInternal {...props} fieldApi={fieldApi}>
      {children}
    </FieldInternal>
  );
}
