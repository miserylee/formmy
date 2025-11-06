import { type ReactElement } from 'react';

import { type DeepKeys } from '@formmy/core';

import { FieldInternal, type FieldInternalProps } from './internal/FieldInternal';
import { useField } from './useField';

export interface FieldProps<T, Key extends DeepKeys<T>> extends Omit<FieldInternalProps<T, Key>, 'fieldApi'> {
  fieldKey: Key;
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
