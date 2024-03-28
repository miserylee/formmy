import { type FormApiImpl } from './FormApi';
import { StateUpdater, SubscribeOptions, UnSubscribeFn, updateState } from '@formmy/store';
import {
  type DeepKeys,
  type DeepValue,
  type FieldApi,
  type FormApi,
  type FormValidationState,
  type FormValidator,
} from './types';

/**
 * fieldApi 本身不管理状态，仅作为一个内置了字段 key binding 的订阅器使用
 */

export class FieldApiImpl<T, Key extends DeepKeys<T>> implements FieldApi<T, Key> {
  constructor(
    private key: Key,
    private form: FormApiImpl<T>
  ) {
    this.subscribe = this.subscribe.bind(this);
  }

  getValidationState = (): FormValidationState => this.form.getValidationState(this.key);

  getForm = (): FormApi<T> => this.form;

  getValue = (): DeepValue<T, Key> => this.form.getValue(this.key);

  setValidationState = (updater: StateUpdater<FormValidationState>): void => {
    this.form.setValidationState(this.key, updater);
  };

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
    return this.form.subscribeField(this.key, type, options);
  }
}
