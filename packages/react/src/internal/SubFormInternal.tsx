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

import { FieldInternal } from './FieldInternal';
import { FormInternal } from './FormInternal';
import { SubscribeInternal } from './SubscribeInternal';
import { type FormBridge, useFormBridgeRef } from './useFormBridgeRef';
import { createFormContext } from '../FormContext';
import { type SubFormFactory } from '../getFormFactory';
import { useForm } from '../useForm';

import type { FieldProps } from '../Field';
import type { FormProps } from '../Form';
import type { SubscribeProps } from '../Subscribe';

export type SubFormRender<T, Prefix extends DeepKeys<T>> = (
  subFormFactory: SubFormFactory<T, Prefix>
) => ReactNode;

export interface SubFormInternalProps<T, Prefix extends DeepKeys<T>>
  extends Omit<FormProps<DeepValue<T, Prefix>>, 'initialValues' | 'values'> {
  prefix: Prefix;
  formApi: IFormApi<T>;
  children?: SubFormRender<T, Prefix>;
  _ref?: ForwardedRef<IFormApi<DeepValue<T, Prefix>>>;
}

export function SubFormInternal<T, Prefix extends DeepKeys<T>>({
  prefix,
  formApi,
  children,
  _ref,
  ...props
}: SubFormInternalProps<T, Prefix>): JSX.Element {
  const subFormFactory = useMemo(() => getSubFormFactory(prefix, () => formApi), [formApi, prefix]);
  return (
    <subFormFactory.Form {...props} ref={_ref}>
      {children?.(subFormFactory)}
    </subFormFactory.Form>
  );
}

export const SubFormFromRoot = forwardRef((props, ref): JSX.Element => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formApi = useForm<any>();
  return <SubFormInternal {...props} _ref={ref} formApi={formApi} />;
}) as <T, Prefix extends DeepKeys<T>>(
  props: Omit<SubFormInternalProps<T, Prefix>, 'formApi' | '_ref'> & {
    ref?: ForwardedRef<IFormApi<DeepValue<T, Prefix>>>;
  }
) => ReactElement;

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
    PropsWithChildren<Omit<FormProps<DeepValue<T, Prefix>>, 'initialValues' | 'values'>>
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

  const SubFormInSubForm = forwardRef((props, ref) => {
    const mainFormApi = useSubForm();

    return <SubFormInternal {...props} _ref={ref} formApi={mainFormApi} />;
  }) as <Prefix2 extends DeepKeys<DeepValue<T, Prefix>>>(
    props: Omit<SubFormInternalProps<DeepValue<T, Prefix>, Prefix2>, 'formApi' | '_ref'> & {
      ref?: ForwardedRef<IFormApi<DeepValue<DeepValue<T, Prefix>, Prefix2>>>;
    }
  ) => ReactElement;

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
    SubForm: SubFormInSubForm,
  };
}
