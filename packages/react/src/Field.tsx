import { type ReactElement, type ReactNode, useEffect, useReducer } from 'react';

import { type DeepKeys, type FormValidator, type IFieldApi } from '@formmy/core';

import { useField } from './useField';

export interface FieldProps<T, Key extends DeepKeys<T>> {
  fieldKey: Key;
  children: (fieldApi: IFieldApi<T, Key>) => ReactNode;
  validators?: FormValidator<T, Key> | FormValidator<T, Key>[];
}

export function Field<T, Key extends DeepKeys<T>>({
  fieldKey,
  children,
  validators,
}: FieldProps<T, Key>): ReactElement {
  const [, reload] = useReducer((p) => p + 1, 0);
  const fieldApi = useField<T, Key>(fieldKey);

  useEffect(() => {
    const _validators = !validators ? [] : Array.isArray(validators) ? validators : [validators];
    // 校验器仅适用一次，后续的忽略
    fieldApi.setValidators((prev) => {
      return [...(prev || []), ..._validators];
    });
    return () => {
      if (!validators) {
        return;
      }
      // 移除校验器
      fieldApi.setValidators((prev) => {
        return prev?.filter((validator) => !_validators.includes(validator));
      });
    };
  }, []);

  // 值或者校验结果发生变更时，触发刷新
  useEffect(() => {
    // 监听变更，触发 rerender
    const unsubValue = fieldApi.subscribe('value', {
      listener: reload,
      immediate: true,
    });
    const unsubError = fieldApi.subscribe('error', {
      listener: reload,
    });
    return () => {
      unsubValue();
      unsubError();
    };
  }, [reload, fieldApi]);

  return <>{children(fieldApi)}</>;
}
