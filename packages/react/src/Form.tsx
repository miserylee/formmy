import {
  type ForwardedRef,
  forwardRef,
  type PropsWithChildren,
  type ReactElement,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { type CreateFormOptions, type IFormApi, FormApi, type FormValidateResult } from '@formmy/core';

import { FormContext } from './FormContext';
import { useUpdatingRef } from './helpers/useUpdatingRef';

export interface FormProps<T> extends CreateFormOptions<T> {
  values?: T;
  onValuesChange?(values: T): void;
  onValidationStatesChange?(states: FormValidateResult<T>): void;
}

export const Form = forwardRef(
  ({ initialValues, children, validators, values, onValidationStatesChange, onValuesChange }, ref) => {
    const formApi = useMemo(() => new FormApi({ initialValues, validators }), []);

    useImperativeHandle(ref, () => formApi, []);

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
      if (!values || [lastUpdatedValuesRef.current, values].includes(formApi.getValues())) {
        return;
      }
      lastUpdatedValuesRef.current = values;
      formApi.setValues(values);
    });

    return (
      <FormContext.Provider value={{ formApi: formApi as IFormApi<unknown> }}>
        {children}
      </FormContext.Provider>
    );
  }
) as <T>(props: PropsWithChildren<FormProps<T>> & { ref?: ForwardedRef<IFormApi<T>> }) => ReactElement;
