import {
  type ForwardedRef,
  forwardRef,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';

import { type DeepKeys, type DeepValue, type IFieldApi, type IFormApi } from '@formmy/core';

import { Field, type FieldProps } from './Field';
import { Form, type FormProps } from './Form';
import { createFormContext } from './FormContext';
import { FieldInternal } from './internal/FieldInternal';
import { FormInternal } from './internal/FormInternal';
import { SubscribeInternal } from './internal/SubscribeInternal';
import { useFormBridgeRef } from './internal/useFormBridgeRef';
import { Subscribe, type SubscribeProps } from './Subscribe';
import { useField } from './useField';
import { useForm as useFormInternal } from './useForm';
import { type FormBridge, useFormBridge } from './useFormBridge';

export interface FormFactory<T, Sub extends boolean = false> {
  Form: (
    props: PropsWithChildren<Sub extends false ? FormProps<T> : Omit<FormProps<T>, 'initialValues'>> & {
      ref?: ForwardedRef<IFormApi<T>>;
    }
  ) => ReactNode;
  Field: <Key extends DeepKeys<T>>(props: FieldProps<T, Key>) => ReactElement;
  Subscribe: (props: SubscribeProps<T>) => ReactElement;
  useForm: () => IFormApi<T>;
  useField: <Key extends DeepKeys<T>>(key: Key) => IFieldApi<T, Key>;
  useFormBridge: () => FormBridge<T>;
  getSubFormFactory: <Prefix2 extends DeepKeys<T>>(prefix: Prefix2) => SubFormFactory<T, Prefix2>;
}

export type SubFormFactory<T, Prefix extends DeepKeys<T>> = FormFactory<DeepValue<T, Prefix>, true>;

export function getFormFactory<T>(): FormFactory<T>;
export function getFormFactory<T>(useForm: () => IFormApi<T>): FormFactory<T, true>;
export function getFormFactory<T>(useForm?: () => IFormApi<T>): FormFactory<T> {
  if (useForm) {
    return getSubFormFactory('.', useForm);
  }
  return {
    Form: Form<T>,
    Field: Field,
    Subscribe: Subscribe<T>,
    useForm: useFormInternal<T>,
    useField: useField,
    useFormBridge: useFormBridge<T>,
    getSubFormFactory: (prefix) => getSubFormFactory(prefix, useFormInternal<T>),
  };
}

export function getSubFormFactory<T, Prefix extends DeepKeys<T>>(
  prefix: Prefix,
  useParentForm: () => IFormApi<T>
): SubFormFactory<T, Prefix> {
  const SubFormContext = createFormContext();

  function useSubForm(): IFormApi<DeepValue<T, Prefix>> {
    const formApi = useContext(SubFormContext);
    if (!formApi) {
      throw new Error('should call useSubForm in context of SubForm');
    }
    return formApi;
  }

  function useSubFormField<Key extends DeepKeys<DeepValue<T, Prefix>>>(
    key: Key
  ): IFieldApi<DeepValue<T, Prefix>, Key> {
    const formApi = useContext(SubFormContext);
    if (!formApi) {
      throw new Error('should call useField in context of SubForm');
    }
    return useMemo(() => formApi.getField(key), [formApi]);
  }

  const SubForm = forwardRef<
    IFormApi<DeepValue<T, Prefix>>,
    PropsWithChildren<Omit<FormProps<DeepValue<T, Prefix>>, 'initialValues'>>
  >(({ validators, interactions, children, ...props }, ref) => {
    const mainFormApi = useParentForm();
    const formApi = useMemo(
      () =>
        mainFormApi.getSubForm({
          prefix,
          interactions,
          validators,
        }),
      [mainFormApi, prefix]
    );
    return (
      <SubFormContext.Provider value={formApi}>
        <FormInternal {...props} _ref={ref} formApi={formApi}>
          {children}
        </FormInternal>
      </SubFormContext.Provider>
    );
  });

  const SubFormField = <Key extends DeepKeys<DeepValue<T, Prefix>>>({
    fieldKey,
    children,
    ...props
  }: FieldProps<DeepValue<T, Prefix>, Key>) => {
    const fieldApi = useSubFormField(fieldKey);

    return (
      <FieldInternal {...props} fieldApi={fieldApi}>
        {children}
      </FieldInternal>
    );
  };

  const SubFormSubscribe = ({ children }: SubscribeProps<DeepValue<T, Prefix>>) => {
    const formApi = useSubForm();
    return <SubscribeInternal formApi={formApi}>{children}</SubscribeInternal>;
  };

  const useSubFormBridge = (): FormBridge<DeepValue<T, Prefix>> => {
    const ref = useFormBridgeRef<DeepValue<T, Prefix>>();
    return {
      ref,
      renderFormExt: (children) => {
        if (!ref.current) {
          return null;
        }
        return <SubFormContext.Provider value={ref.current}>{children}</SubFormContext.Provider>;
      },
    };
  };

  return {
    useForm: useSubForm,
    useField: useSubFormField,
    Form: SubForm,
    Field: SubFormField,
    Subscribe: SubFormSubscribe,
    useFormBridge: useSubFormBridge,
    getSubFormFactory: (prefix2) => getSubFormFactory(prefix2, useSubForm),
  };
}
