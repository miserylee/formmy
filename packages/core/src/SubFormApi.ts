/* eslint-disable @typescript-eslint/no-explicit-any */

import { type StateUpdater, type SubscribeOptions, type UnSubscribeFn, updateState } from '@formmy/store';

import { FieldApi } from './FieldApi';
import {
  type CreateSubFormOptions,
  type DeepKeys,
  type DeepValue,
  type FormErrorsMap,
  type FormInteraction,
  type FormValidateResult,
  type FormValidationError,
  type FormValidationState,
  type FormValidator,
  type FormValidatorsMap,
  type FormValidatorWithDeps,
  type IFieldApi,
  type IFormApi,
  type CompiledValidator,
  EMPTY_VALIDATION_STATE,
} from './types';

export class SubFormApi<U, Prefix extends DeepKeys<U>> implements IFormApi<DeepValue<U, Prefix>> {
  private validatorsMap = new WeakMap<FormValidator<DeepValue<U, Prefix>, any>, FormValidator<U, any>>();
  private reversedValidatorsMap = new WeakMap<
    FormValidator<U, any>,
    FormValidator<DeepValue<U, Prefix>, any>
  >();
  private interactions: FormInteraction<DeepValue<U, Prefix>>[] = [];
  private interactionsMap = new WeakMap<FormInteraction<DeepValue<U, Prefix>>, FormInteraction<U>>();

  constructor(private options: CreateSubFormOptions<U, Prefix>) {
    this.validate = this.validate.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.subscribeField = this.subscribeField.bind(this);
    this.submit = this.submit.bind(this);

    if (options.validators) {
      this.setValidators((prev) => ({
        ...prev,
        ...options.validators,
      }));
    }
    if (options.interactions) {
      this.setInteractions((prev) => [...prev, ...(options.interactions ?? [])]);
    }
  }

  private isSubFormKey(key: string): boolean {
    return (
      key === this.options.prefix ||
      this.options.prefix === '.' ||
      (key.startsWith(this.options.prefix) && key.at(this.options.prefix.length) === '.')
    );
  }

  private prefixKey(key: string): DeepKeys<U> {
    if (key === '.') {
      return this.options.prefix;
    }
    if (this.options.prefix === '.') {
      return key as DeepKeys<U>;
    }
    return `${this.options.prefix}.${key}` as DeepKeys<U>;
  }

  private subKey(key: string): DeepKeys<DeepValue<U, Prefix>> {
    if (this.options.prefix === '.') {
      return key as DeepKeys<DeepValue<U, Prefix>>;
    }
    return (key.slice(this.options.prefix.length + 1) || '.') as DeepKeys<DeepValue<U, Prefix>>;
  }

  setValidators = (updater: StateUpdater<FormValidatorsMap<DeepValue<U, Prefix>>>): void => {
    this.options.formApi.setValidators((prev) => {
      const { subFormMap, restMap } = Object.entries(prev).reduce<{
        subFormMap: FormValidatorsMap<DeepValue<U, Prefix>>;
        restMap: FormValidatorsMap<U>;
      }>(
        (acc, [key, mainFormValidators]) => {
          if (!mainFormValidators) {
            return acc;
          }
          if (this.isSubFormKey(key)) {
            acc.subFormMap[this.subKey(key)] = mainFormValidators.map((v: FormValidator<U, any>) => {
              const cachedValidator = this.reversedValidatorsMap.get(v);
              if (cachedValidator) {
                return cachedValidator;
              }
              // normalize validator to sub form validator
              let _validator: FormValidatorWithDeps<DeepValue<U, Prefix>, any>;
              if (typeof v === 'function') {
                _validator = {
                  validate: (value) => {
                    return v(value as DeepValue<U, any>, this.options.formApi.getField(key as DeepKeys<U>));
                  },
                  deps: [],
                };
              } else {
                _validator = {
                  ...v,
                  validate: (value) => {
                    return v.validate(
                      value as DeepValue<U, any>,
                      this.options.formApi.getField(key as DeepKeys<U>)
                    );
                  },
                  deps: v.deps?.map((dep) => this.subKey(dep)),
                };
              }
              this.validatorsMap.set(_validator, v);
              this.reversedValidatorsMap.set(v, _validator);
              return _validator;
            });
          } else {
            acc.restMap[key as DeepKeys<U>] = mainFormValidators;
          }
          return acc;
        },
        {
          subFormMap: {},
          restMap: {},
        }
      );
      const next = updateState(subFormMap, updater);
      const updatedMap = Object.entries(next).reduce<FormValidatorsMap<U>>((acc, [key, validators]) => {
        if (!validators) {
          return acc;
        }
        acc[this.prefixKey(key)] = validators.map((v: FormValidator<DeepValue<U, Prefix>, any>) => {
          const cachedValidator = this.validatorsMap.get(v);
          if (cachedValidator) {
            return cachedValidator;
          }
          // normalize validator to main form validator
          let _validator: FormValidatorWithDeps<U, any>;
          if (typeof v === 'function') {
            _validator = {
              validate: (value) => {
                return v(
                  value as DeepValue<DeepValue<U, Prefix>, any>,
                  this.getField(key as DeepKeys<DeepValue<U, Prefix>>)
                );
              },
              deps: [],
            };
          } else {
            _validator = {
              ...v,
              validate: (value) => {
                return v.validate(
                  value as DeepValue<DeepValue<U, Prefix>, any>,
                  this.getField(key as DeepKeys<DeepValue<U, Prefix>>)
                );
              },
              deps: v.deps?.map((dep: string) => this.prefixKey(dep)),
            };
          }
          this.validatorsMap.set(v, _validator);
          this.reversedValidatorsMap.set(_validator, v);
          return _validator;
        });
        return acc;
      }, {});
      return {
        ...restMap,
        ...updatedMap,
      };
    });
  };
  setInteractions = (updater: StateUpdater<FormInteraction<DeepValue<U, Prefix>>[]>): void => {
    this.options.formApi.setInteractions((prev) => {
      const prevMainFormInteractions = this.interactions.map((i) => this.interactionsMap.get(i));
      const next = updateState(this.interactions, updater);
      this.interactions = next;
      const nextMainFormInteractions = next.map((i) => {
        return {
          deps: i.deps.map((dep) => this.prefixKey(dep)),
          action: () => {
            return i.action(this);
          },
        };
      });
      return [...prev.filter((i) => !prevMainFormInteractions.includes(i)), ...nextMainFormInteractions];
    });
  };
  setValues = (updater: StateUpdater<DeepValue<U, Prefix>>): void => {
    this.options.formApi.setValue(this.options.prefix, updater as StateUpdater<DeepValue<U, Prefix>>);
  };
  setValue = <Key extends DeepKeys<DeepValue<U, Prefix>>>(
    key: Key,
    updater: StateUpdater<DeepValue<DeepValue<U, Prefix>, Key>>
  ): void => {
    this.options.formApi.setValue(this.prefixKey(key), updater as StateUpdater<any>);
  };
  getValues = (): DeepValue<U, Prefix> => {
    return this.options.formApi.getValue(this.options.prefix);
  };
  getValue = <Key extends DeepKeys<DeepValue<U, Prefix>>>(key: Key): DeepValue<DeepValue<U, Prefix>, Key> => {
    return this.options.formApi.getValue(this.prefixKey(key)) as DeepValue<DeepValue<U, Prefix>, Key>;
  };
  setValidationStates = (updater: StateUpdater<FormErrorsMap<DeepValue<U, Prefix>>>): void => {
    this.options.formApi.setValidationStates((prev) => {
      const { subFormMap, restMap } = Object.entries(prev).reduce<{
        subFormMap: FormErrorsMap<DeepValue<U, Prefix>>;
        restMap: FormErrorsMap<U>;
      }>(
        (acc, [key, state]) => {
          if (!state) {
            return acc;
          }
          if (this.isSubFormKey(key)) {
            acc.subFormMap[this.subKey(key)] = state;
          } else {
            acc.restMap[key as DeepKeys<U>] = state;
          }
          return acc;
        },
        {
          subFormMap: {},
          restMap: {},
        }
      );
      const next = updateState(subFormMap, updater);
      return {
        ...restMap,
        ...Object.entries(next).reduce<FormErrorsMap<U>>((acc, [key, state]) => {
          if (!state) {
            return acc;
          }
          acc[this.prefixKey(key)] = state;
          return acc;
        }, {}),
      };
    });
  };
  setValidationState = (
    key: DeepKeys<DeepValue<U, Prefix>>,
    updater: StateUpdater<FormValidationState>
  ): void => {
    this.setValidationStates((prev) => {
      return {
        ...prev,
        [key]: updateState(prev[key] ?? { ...EMPTY_VALIDATION_STATE }, updater),
      };
    });
  };
  getValidationState = (key: DeepKeys<DeepValue<U, Prefix>>): FormValidationState => {
    return this.options.formApi.getValidationState(this.prefixKey(key));
  };
  getValidationStates = (): FormValidateResult<DeepValue<U, Prefix>> => {
    return Object.entries(this.options.formApi.getValidationStates().errors).reduce<
      FormValidateResult<DeepValue<U, Prefix>>
    >(
      (acc, [key, _state]) => {
        if (!_state) {
          return acc;
        }
        const state = _state as FormValidationState;
        if (this.isSubFormKey(key)) {
          acc.errors[this.subKey(key)] = state;
          if (!state.isValid) {
            acc.isValid = false;
          }
          if (state.isValidating) {
            acc.isValidating = true;
          }
        }
        return acc;
      },
      {
        errors: {},
        isValid: true,
        isValidating: false,
      }
    );
  };
  resetValidationStates = (): void => {
    this.setValidationStates((prev) => {
      return {};
    });
  };
  resetValidationState = (key: DeepKeys<DeepValue<U, Prefix>>): void => {
    this.options.formApi.resetValidationState(this.prefixKey(key));
  };
  async validate(): Promise<FormValidateResult<DeepValue<U, Prefix>>>;
  async validate(key: DeepKeys<DeepValue<U, Prefix>>): Promise<FormValidationState>;
  async validate(
    key?: DeepKeys<DeepValue<U, Prefix>>
  ): Promise<FormValidateResult<DeepValue<U, Prefix>> | FormValidationState> {
    if (key !== undefined) {
      return this.options.formApi.validate(this.prefixKey(key));
    }
    // reset all validation states of sub form
    this.resetValidationStates();
    // unsafe get internal props of formApi
    const compiledValidators = Reflect.get(this.options.formApi, 'compiledValidators') as Map<
      string,
      Map<FormValidator<DeepValue<U, Prefix>, any>, CompiledValidator>
    >;
    await Promise.all(
      [...compiledValidators.keys()]
        .filter((k) => this.isSubFormKey(k))
        .map(async (k) => {
          return this.options.formApi.validate(k as DeepKeys<U>);
        })
    );
    return this.getValidationStates();
  }
  submit(): Promise<DeepValue<U, Prefix>>;
  submit(
    onSuccess: (values: DeepValue<U, Prefix>) => void,
    onError?: (errors: FormErrorsMap<DeepValue<U, Prefix>>) => void
  ): Promise<boolean>;
  async submit(
    onSuccess?: (values: DeepValue<U, Prefix>) => void,
    onError?: (errors: FormErrorsMap<DeepValue<U, Prefix>>) => void
  ): Promise<boolean | DeepValue<U, Prefix>> {
    // same as submit in FormApi
    const { errors, isValid } = await this.validate();

    if (onSuccess) {
      if (isValid) {
        onSuccess(this.getValues());
        return true;
      }

      onError?.(errors);
      return false;
    }

    if (isValid) {
      return this.getValues();
    }
    const err = new Error(`the form validation failed.`);
    Object.assign(err, { errors });
    throw err;
  }
  getField = <Key extends DeepKeys<DeepValue<U, Prefix>>>(key: Key): IFieldApi<DeepValue<U, Prefix>, Key> => {
    return new FieldApi<DeepValue<U, Prefix>, Key>(key, this);
  };
  subscribe<V = DeepValue<U, Prefix>>(
    type: 'values',
    options: SubscribeOptions<DeepValue<U, Prefix>, V>
  ): UnSubscribeFn;
  subscribe<V = DeepValue<U, Prefix>>(
    type: 'errors',
    options: SubscribeOptions<FormErrorsMap<DeepValue<U, Prefix>>, V>
  ): UnSubscribeFn;
  subscribe(type: 'values' | 'errors', options: SubscribeOptions<any, any>): UnSubscribeFn {
    switch (type) {
      case 'errors':
        return this.options.formApi.subscribe('errors', {
          ...options,
          selector: (state) =>
            Object.entries(state).reduce<FormErrorsMap<DeepValue<U, Prefix>>>((acc, [key, _state]) => {
              if (!_state) {
                return acc;
              }
              if (this.isSubFormKey(key)) {
                acc[this.subKey(key)] = _state;
              }
              return acc;
            }, {}),
          isValueChanged: (prev, current) => {
            const prevKeys = Object.keys(prev);
            const currentKeys = Object.keys(current);
            return !(
              prevKeys.length === currentKeys.length &&
              prevKeys.every((key) => Reflect.get(current, key) === Reflect.get(prev, key))
            );
          },
        });
      case 'values':
        return this.options.formApi.subscribe('values', {
          ...options,
          selector: () => this.getValues(),
        });
    }
  }
  subscribeField<Key extends DeepKeys<DeepValue<U, Prefix>>>(
    key: Key,
    type: 'value',
    options: Omit<
      SubscribeOptions<DeepValue<DeepValue<U, Prefix>, Key>, DeepValue<DeepValue<U, Prefix>, Key>>,
      'selector'
    >
  ): UnSubscribeFn;
  subscribeField<Key extends DeepKeys<DeepValue<U, Prefix>>>(
    key: Key,
    type: 'error',
    options: Omit<SubscribeOptions<FormValidationError, FormValidationError>, 'selector'>
  ): UnSubscribeFn;
  subscribeField<Key extends DeepKeys<DeepValue<U, Prefix>>>(
    key: Key,
    type: 'value' | 'error',
    options: Omit<SubscribeOptions<unknown, unknown>, 'selector'>
  ): UnSubscribeFn;
  subscribeField<Key extends DeepKeys<DeepValue<U, Prefix>>>(
    key: Key,
    type: 'value' | 'error',
    options: Omit<SubscribeOptions<any, any>, 'selector'>
  ): UnSubscribeFn {
    return this.options.formApi.subscribeField(this.prefixKey(key), type as any, options);
  }
  reset = (): void => {
    // @NOTE: sub form cannot reset values
    this.resetValidationStates();
  };
  destroy = (): void => {
    // @NOTE: sub form not really destroy, but only remove validation states, validators and interactions
    this.resetValidationStates();
    this.setValidators(() => ({}));
    this.setInteractions(() => []);
  };
  // 获取子表单实例
  getSubForm = <Prefix2 extends DeepKeys<DeepValue<U, Prefix>>>({
    prefix,
    interactions,
    validators,
  }: Omit<CreateSubFormOptions<DeepValue<U, Prefix>, Prefix2>, 'formApi'>): IFormApi<
    DeepValue<DeepValue<U, Prefix>, Prefix2>
  > => {
    return new SubFormApi<DeepValue<U, Prefix>, Prefix2>({
      formApi: this.options.formApi as unknown as IFormApi<DeepValue<U, Prefix>>,
      prefix: this.prefixKey(prefix) as Prefix2,
      interactions,
      validators,
    }) as IFormApi<DeepValue<DeepValue<U, Prefix>, Prefix2>>;
  };
}
