import { type ReactElement, type ReactNode, useEffect, useReducer } from 'react';

import { type DeepKeys, type FormValidator, type IFieldApi } from '@formmy/core';

import { useMemoDeps } from './helpers/useMemoDeps';
import { useField } from './useField';

export interface FieldProps<T, Key extends DeepKeys<T>> {
  fieldKey: Key;
  deps?: DeepKeys<T>[];
  children: (fieldApi: IFieldApi<T, Key>) => ReactNode;
  validators?: FormValidator<T, Key> | FormValidator<T, Key>[];
}

export function Field<T, Key extends DeepKeys<T>>({
  fieldKey,
  deps,
  children,
  validators,
}: FieldProps<T, Key>): ReactElement {
  const [, reload] = useReducer((p) => p + 1, 0);
  const fieldApi = useField<T, Key>(fieldKey);

  const memoDeps = useMemoDeps<T>(deps ?? []);

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
    const unsubFns: (() => void)[] = [];
    // 监听变更，触发 rerender
    unsubFns.push(
      fieldApi.subscribe('value', {
        listener: reload,
        immediate: true,
      }),
      fieldApi.subscribe('error', {
        listener: reload,
      })
    );
    // 监听 deps 值变更，触发刷新

    return () => {
      unsubFns.forEach((fn) => fn());
    };
  }, [reload, fieldApi]);

  // 依赖的字段值变更时，触发刷新
  useEffect(() => {
    const unsubFns: (() => void)[] = [];
    memoDeps.forEach((dep) => {
      unsubFns.push(
        fieldApi.getForm().subscribeField(dep, 'value', {
          listener: reload,
          immediate: true,
        })
      );
    });
    return () => {
      unsubFns.forEach((fn) => fn());
    };
  }, [memoDeps, reload, fieldApi]);

  return <>{children(fieldApi)}</>;
}
