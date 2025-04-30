import {
  type ForwardedRef,
  type PropsWithChildren,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

import { type FormValidateResult, type IFormApi } from '@formmy/core';

import { useUpdatingRef } from '../helpers/useUpdatingRef';

export interface FormInternalProps<T> {
  values?: T;
  onValuesChange?(values: T): void;
  onValidationStatesChange?(states: FormValidateResult<T>): void;
  _ref: ForwardedRef<IFormApi<T>>;
  formApi: IFormApi<T>;
}

export function FormInternal<T>({
  _ref,
  onValidationStatesChange,
  onValuesChange,
  values,
  formApi,
  children,
}: PropsWithChildren<FormInternalProps<T>>): JSX.Element {
  useImperativeHandle(_ref, () => formApi, []);

  const onValuesChangeRef = useUpdatingRef(onValuesChange);
  const onValidationStatesChangeRef = useUpdatingRef(onValidationStatesChange);

  const lastUpdatedValuesRef = useRef(values);

  useEffect(() => {
    formApi.subscribe('values', {
      listener: (_values) => {
        if (lastUpdatedValuesRef.current !== _values) {
          onValuesChangeRef.current?.(_values);
        }
      },
      immediate: true,
    });
    formApi.subscribe('errors', {
      listener: () => {
        onValidationStatesChangeRef.current?.(formApi.getValidationStates());
      },
    });
    return () => {
      formApi.destroy();
    };
  }, [formApi]);

  // 受控组件，值不一致时，强制设置 values
  useLayoutEffect(() => {
    if (!values || [lastUpdatedValuesRef.current, formApi.getValues()].includes(values)) {
      return;
    }
    lastUpdatedValuesRef.current = values;
    formApi.setValues(values);
  });

  return <>{children}</>;
}
