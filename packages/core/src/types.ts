import { type StateUpdater, type SubscribeOptions, type UnSubscribeFn } from '@formmy/store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyArray = any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyObject = Record<string, any>;

type DeepKeysPrefix<T, Prefix, Depth extends unknown[]> = Prefix extends keyof T & (string | number)
  ? `${Prefix}` | `${Prefix}.${DeepKeysWithoutSelf<Required<T>[Prefix], [...Depth, unknown]> & string}`
  : never;

type DeepKeysWithoutSelf<T, Depth extends unknown[] = []> = Depth['length'] extends 5
  ? // 最多下钻 5 层
    never
  : unknown extends T
    ? // T 为 unknown 时，支持任意 key
      string
    : T extends string | number
      ? // T 为枚举值，不能下钻
        never
      : T extends AnyArray
        ? // T 为数组时，下钻
          DeepKeysPrefix<T, number, Depth>
        : T extends Date
          ? // T 为 Date 时，不支持下钻
            never
          : T extends object
            ? // T 为对象时，支持当前对象的字段 key，同时继续下钻
              DeepKeysPrefix<T, keyof T & string, Depth>
            : never;

// . 表示整个表单值本身，应用于整体数据校验的场景
export type DeepKeys<T> = `${DeepKeysWithoutSelf<T> | '.'}`;

// 根据 key 推导其值类型
export type DeepValue<T, DeepKey extends DeepKeys<T>> = DeepKey extends '.'
  ? T
  : T extends AnyObject
    ? DeepKey extends `${infer Prefix}.${infer RestKey}`
      ? RestKey extends DeepKeys<T[Prefix]>
        ? undefined extends T
          ? DeepValue<T[Prefix], RestKey> | undefined
          : null extends T
            ? DeepValue<T[Prefix], RestKey> | undefined
            : void extends T
              ? DeepValue<T[Prefix], RestKey> | undefined
              : AnyArray extends T
                ? DeepValue<T[Prefix], RestKey> | undefined
                : DeepValue<T[Prefix], RestKey>
        : never
      : AnyArray extends T
        ? T[DeepKey & string] | undefined
        : T[DeepKey & string]
    : never;

// 校验结果，如果是 void 表示校验通过，其他则为校验失败的原因
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormValidationError = any | undefined;

// 简化版校验器，默认 deps 为空
export type FormValidatorLite<T, Key extends DeepKeys<T>> = (
  value: DeepValue<T, Key>,
  field: IFieldApi<T, Key>
) => FormValidationError | Promise<FormValidationError>;

// 带依赖的校验器
export interface FormValidatorWithDeps<T, Key extends DeepKeys<T>> {
  validate: FormValidatorLite<T, Key>;
  // 依赖的字段值发生变更时，需要触发校验
  deps?: DeepKeys<T>[];
}

// 校验器
export type FormValidator<T, Key extends DeepKeys<T>> =
  | FormValidatorLite<T, Key>
  | FormValidatorWithDeps<T, Key>;

// 校验状态
export interface FormValidationState {
  isValidating: boolean;
  isValid: boolean;
  message: FormValidationError;
}

// 校验状态 map
export type FormErrorsMap<T> = {
  [Key in DeepKeys<T>]?: FormValidationState;
};

// 表单整体的校验结果
export interface FormValidateResult<T> {
  errors: FormErrorsMap<T>;
  isValid: boolean;
  isValidating: boolean;
}

// 表单校验器 map
export type FormValidatorsMap<T> = {
  [Key in DeepKeys<T>]?: FormValidator<T, Key>[];
};

// form api
export interface IFormApi<T> {
  setValidators(updater: StateUpdater<FormValidatorsMap<T>>): void;
  setValues(updater: StateUpdater<T>): void;
  setValue<Key extends DeepKeys<T>>(key: Key, updater: StateUpdater<DeepValue<T, Key>>): void;
  getValues(): T;
  getValue<Key extends DeepKeys<T>>(key: Key): DeepValue<T, Key>;
  setValidationStates(updater: StateUpdater<FormErrorsMap<T>>): void;
  setValidationState(key: DeepKeys<T>, updater: StateUpdater<FormValidationState>): void;
  getValidationState(key: DeepKeys<T>): FormValidationState;
  getValidationStates(): FormValidateResult<T>;
  validate(): Promise<FormValidateResult<T>>;
  validate(key: DeepKeys<T>): Promise<FormValidationState>;
  submit(onSuccess: (values: T) => void, onError?: (errors: FormErrorsMap<T>) => void): Promise<boolean>;
  getField<Key extends DeepKeys<T>>(key: Key): IFieldApi<T, Key>;
  subscribe<V = T>(type: 'values', options: SubscribeOptions<T, V>): UnSubscribeFn;
  subscribe<V = FormErrorsMap<T>>(
    type: 'errors',
    options: SubscribeOptions<FormErrorsMap<T>, V>
  ): UnSubscribeFn;
  subscribeField<Key extends DeepKeys<T>>(
    key: Key,
    type: 'value',
    options: SubscribeOptions<DeepValue<T, Key>, DeepValue<T, Key>>
  ): UnSubscribeFn;
  subscribeField<Key extends DeepKeys<T>>(
    key: Key,
    type: 'error',
    options: SubscribeOptions<FormValidationError, FormValidationError>
  ): UnSubscribeFn;
  reset(): void;
  destroy(): void;
}

export interface IPureFieldApi<Value> {
  getValue(): Value;
  setValue(updater: StateUpdater<Value>): void;
  setValidationState(updater: StateUpdater<FormValidationState>): void;
  getValidationState(): FormValidationState;
  validate(): Promise<FormValidationState>;
  subscribe(type: 'value', options: Omit<SubscribeOptions<Value, Value>, 'selector'>): UnSubscribeFn;
  subscribe(
    type: 'error',
    options: Omit<SubscribeOptions<FormValidationState, FormValidationState>, 'selector'>
  ): UnSubscribeFn;
}

// field api
export interface IFieldApi<T, Key extends DeepKeys<T>> extends IPureFieldApi<DeepValue<T, Key>> {
  setValidators(updater: StateUpdater<FormValidator<T, Key>[] | undefined>): void;
  getForm(): IFormApi<T>;
}

export interface CreateFormOptions<T> {
  initialValues: T;
  validators?: FormValidatorsMap<T>;
}
