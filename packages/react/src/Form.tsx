import { type ForwardedRef, forwardRef, type PropsWithChildren, type ReactElement, useMemo } from 'react';

import { type CreateFormOptions, type IFormApi, FormApi, type FormValidateResult } from '@formmy/core';

import { FormContext } from './FormContext';
import { FormInternal } from './internal/FormInternal';

export interface FormProps<T> extends CreateFormOptions<T> {
  values?: T;
  onValuesChange?(values: T): void;
  onValidationStatesChange?(states: FormValidateResult<T>): void;
}

export const Form = forwardRef(({ initialValues, validators, interactions, children, ...props }, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formApi = useMemo(() => new FormApi<any>({ initialValues, validators, interactions }), []);

  return (
    <FormContext.Provider value={formApi}>
      <FormInternal {...props} _ref={ref} formApi={formApi}>
        {children}
      </FormInternal>
    </FormContext.Provider>
  );
}) as <T>(props: PropsWithChildren<FormProps<T>> & { ref?: ForwardedRef<IFormApi<T>> }) => ReactElement;
