import { type StateUpdater, type SubscribeOptions, type UnSubscribeFn, updateState } from '@formmy/store';

import {
  type DeepKeys,
  type DeepValue,
  type IFieldApi,
  type IFormApi,
  type FormValidationState,
  type FormValidator,
} from './types';

/**
 * fieldApi 本身不管理状态，仅作为一个内置了字段 key binding 的订阅器使用
 */

export class FieldApi<T, Key extends DeepKeys<T>> implements IFieldApi<T, Key> {
  constructor(
    private key: Key,
    private form: IFormApi<T>
  ) {
    this.subscribe = this.subscribe.bind(this);
  }

  getValidationState = (): FormValidationState => this.form.getValidationState(this.key);

  getForm = (): IFormApi<T> => this.form;

  getValue = (): DeepValue<T, Key> => this.form.getValue(this.key);

  setValidationState = (updater: StateUpdater<FormValidationState>): void => {
    this.form.setValidationState(this.key, updater);
  };

  resetValidationStates(): void {
    this.form.resetValidationState(this.key);
  }

  setValidators = (updater: StateUpdater<FormValidator<T, Key>[] | undefined>): void => {
    this.form.setValidators((prev) => {
      return {
        ...prev,
        [this.key]: updateState(prev[this.key], updater),
      };
    });
  };

  setValue = (updater: StateUpdater<DeepValue<T, Key>>): void => {
    this.form.setValue(this.key, updater);
  };

  validate = (): Promise<FormValidationState> => this.form.validate(this.key);

  subscribe<V>(type: 'value', options: SubscribeOptions<DeepValue<T, Key>, V>): UnSubscribeFn;
  subscribe<V>(type: 'error', options: SubscribeOptions<FormValidationState, V>): UnSubscribeFn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(type: 'value' | 'error', options: SubscribeOptions<any, any>): UnSubscribeFn {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.form.subscribeField(this.key, type as any, options);
  }

  getKey(): Key {
    return this.key;
  }
}
