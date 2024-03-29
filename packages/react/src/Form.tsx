import {
  ForwardedRef,
  forwardRef,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
} from 'react';
import { CreateFormOptions, IFormApi, FormApi, FormValidateResult } from '@formmy/core';
import { FormContext } from './FormContext';
import { useUpdatingRef } from './helpers/useUpdatingRef';
import { usePrevious } from './helpers/usePrevious';

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

    useEffect(() => {
      const unsubValues = formApi.subscribe('values', {
        listener: (_values) => {
          onValuesChangeRef.current?.(_values);
        },
        immediate: true,
      });
      const unsubErrors = formApi.subscribe('errors', {
        listener: () => {
          onValidationStatesChangeRef.current?.(formApi.getValidationStates());
        },
      });
      return () => {
        unsubValues();
        unsubErrors();
      };
    }, [formApi]);

    const prevValues = usePrevious(values);
    // 受控组件，值不一致时，强制设置 values
    useLayoutEffect(() => {
      if (!values || [prevValues, values].includes(formApi.getValues())) {
        return;
      }
      formApi.setValues(values);
    });

    return (
      <FormContext.Provider value={{ formApi: formApi as IFormApi<unknown> }}>
        {children}
      </FormContext.Provider>
    );
  }
) as <T>(props: PropsWithChildren<FormProps<T>> & { ref?: ForwardedRef<IFormApi<T>> }) => ReactElement;
