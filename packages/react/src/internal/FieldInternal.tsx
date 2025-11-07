import { type ReactNode, useEffect, useReducer } from 'react';

import { type DeepKeys, type FormValidator, type IFieldApi } from '@formmy/core';

import { useMemoDeps } from '../helpers/useMemoDeps';
import { useUpdatingRef } from '../helpers/useUpdatingRef';

export interface FieldInternalProps<T, Key extends DeepKeys<T>> {
  deps?: DeepKeys<T>[];
  children: (fieldApi: IFieldApi<T, Key>) => ReactNode;
  validators?: FormValidator<T, Key> | FormValidator<T, Key>[];
  /**
   * when values of deps changed, reset the validators of field using the latest prop
   * default not reset after mount
   */
  resetValidatorsDeps?: unknown[];
  fieldApi: IFieldApi<T, Key>;
  retainValidationStatesWhenDestroy?: boolean;
}

export function FieldInternal<T, Key extends DeepKeys<T>>({
  children,
  deps,
  validators,
  resetValidatorsDeps = [],
  fieldApi,
  retainValidationStatesWhenDestroy,
}: FieldInternalProps<T, Key>): JSX.Element {
  const [, reload] = useReducer((p) => p + 1, 0);
  const memoDeps = useMemoDeps<T>(deps ?? []);

  const retainValidationStatesWhenDestroyRef = useUpdatingRef(retainValidationStatesWhenDestroy);
  const validatorsRef = useUpdatingRef(validators);

  useEffect(() => {
    const v = validatorsRef.current;
    const _validators = !v ? [] : Array.isArray(v) ? v : [v];
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
      // 清除掉校验状态
      if (!retainValidationStatesWhenDestroyRef.current) {
        fieldApi.resetValidationStates();
      }
    };
  }, [...resetValidatorsDeps, fieldApi]);

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
