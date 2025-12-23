import { type ForwardedRef, type PropsWithChildren, type ReactElement, type ReactNode } from 'react';

import { type DeepKeys, type DeepValue, type IFieldApi, type IFormApi } from '@formmy/core';

import { Field, type FieldProps } from './Field';
import { Form, type FormProps } from './Form';
import { getSubFormFactory, type SubFormInternalProps } from './internal/SubFormInternal';
import { SubFormFromRoot } from './internal/SubFormInternal';
import { Subscribe, type SubscribeProps } from './Subscribe';
import { useField } from './useField';
import { useForm as useFormInternal } from './useForm';
import { type FormBridge, useFormBridge } from './useFormBridge';

export interface FormFactory<T, Sub extends boolean = false> {
  /**
   * use factory to create a new form context
   */
  Form: (
    props: PropsWithChildren<
      Sub extends false ? FormProps<T> : Omit<FormProps<T>, 'initialValues' | 'values'>
    > & {
      ref?: ForwardedRef<IFormApi<T>>;
    }
  ) => ReactNode;
  /**
   * use factory to binding a field to form context
   */
  Field: <Key extends DeepKeys<T>>(props: FieldProps<T, Key>) => ReactElement;
  /**
   * use factory to listening the form to form context
   */
  Subscribe: (props: SubscribeProps<T>) => ReactElement;
  /**
   * get a form api instance by hook
   */
  useForm: () => IFormApi<T>;
  /**
   * get a field api instance by hook
   */
  useField: <Key extends DeepKeys<T>>(key: Key) => IFieldApi<T, Key>;
  /**
   * get a form bridge instance
   */
  useFormBridge: () => FormBridge<T>;
  /**
   * get a sub form factory from main form factory with prefix
   * you should memorize it when calling in the component render function
   */
  getSubFormFactory: <Prefix extends DeepKeys<T>>(prefix: Prefix) => SubFormFactory<T, Prefix>;
  /**
   * get a sub form factory from main form factory in a component context for memorizing
   * you can get a memorized sub form factory in render children props
   * it can replace the role of Form, so you can skip wrapping Form in sub form
   */
  SubForm: <Prefix extends DeepKeys<T>>(
    props: Omit<SubFormInternalProps<T, Prefix>, '_ref' | 'formApi'> & {
      ref?: ForwardedRef<IFormApi<DeepValue<T, Prefix>>>;
    }
  ) => ReactElement;
}

export type SubFormFactory<T, Prefix extends DeepKeys<T> = '.'> = FormFactory<DeepValue<T, Prefix>, true>;

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
    SubForm: SubFormFromRoot,
  };
}
