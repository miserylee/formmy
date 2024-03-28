import { Immer } from 'immer';
import get from 'lodash.get';
import set from 'lodash.set';

import { FieldApiImpl } from './FieldApi';
import Store, { updateState, StateUpdater, UnSubscribeFn, SubscribeOptions } from '@formmy/store';
import {
  type CreateFormOptions,
  type DeepKeys,
  type DeepValue,
  type FieldApi,
  type FormApi,
  type FormErrorsMap,
  type FormValidateResult,
  type FormValidationError,
  type FormValidationState,
  type FormValidator,
  type FormValidatorsMap,
} from './types';

const immer = new Immer({ autoFreeze: false });

type ValidateFn = () => Promise<void>;

const EMPTY_VALIDATION_STATE: FormValidationState = {
  isValidating: false,
  isValid: true,
  message: undefined,
};

interface CompiledValidator {
  validateFn: ValidateFn;
  validationStates: FormValidationState;
  subscribes: UnSubscribeFn[];
}

export class FormApiImpl<T> implements FormApi<T> {
  private validators: Store<FormValidatorsMap<T>>;
  private values: Store<T>;
  private validationStates: Store<FormErrorsMap<T>>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private compiledValidators = new Map<string, Map<FormValidator<T, any>, CompiledValidator>>();
  private validateFunctionsQueue = new Set<ValidateFn>();

  private subscribes: UnSubscribeFn[] = [];

  constructor(private options: CreateFormOptions<T>) {
    this.validate = this.validate.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.subscribeField = this.subscribeField.bind(this);

    // 初始化 store
    this.validationStates = new Store({});
    this.values = new Store(this.options.initialValues);
    this.validators = new Store(this.options.validators ?? {});
    // 初始化编译一次校验器
    this.recompileValidators();

    // 当校验器发生变更时，重新编译校验器
    this.validators.subscribe({
      listener: () => this.recompileValidators(),
    });
  }

  private getCompiledValidator = <Key extends DeepKeys<T>>(key: Key, validator: FormValidator<T, Key>) =>
    this.compiledValidators.get(key)?.get(validator);

  private setCompiledValidator = <Key extends DeepKeys<T>>(
    key: Key,
    validator: FormValidator<T, Key>,
    compiledValidator: CompiledValidator
  ) => {
    let subMap = this.compiledValidators.get(key);
    if (!subMap) {
      subMap = new Map();
      this.compiledValidators.set(key, subMap);
    }
    subMap.set(validator, compiledValidator);
  };

  private deleteCompiledValidator = <Key extends DeepKeys<T>>(key: Key, validator: FormValidator<T, Key>) => {
    const compiledValidator = this.getCompiledValidator(key, validator);
    if (compiledValidator) {
      compiledValidator.subscribes.forEach((unsubscribe) => unsubscribe());
    }
    this.compiledValidators.get(key)?.delete(validator);
  };

  private compileValidator = <Key extends DeepKeys<T>>(key: Key, validator: FormValidator<T, Key>) => {
    const { validate, deps } = validator;
    const validationStates = { ...EMPTY_VALIDATION_STATE };
    const fieldApi = this.getField(key);
    const validateFn = async () => {
      const fieldValue = this.getValue(key);
      const depValues = deps ? deps.map((dep) => this.getValue(dep)) : this.getValues();
      const updateValidationState = (updates: Partial<FormValidationState>) => {
        Object.assign(validationStates, updates);
        // 收集这个字段对应所有校验函数对应的状态，做合并计算
        const allCompiledValidatorsOfKey = [...(this.compiledValidators.get(key)?.values() ?? [])];
        this.setValidationState(
          key,
          allCompiledValidatorsOfKey.reduce<FormValidationState>(
            (acc, item) => {
              const states = item.validationStates;
              return {
                isValidating: states.isValidating || acc.isValidating,
                isValid: states.isValid && acc.isValid,
                message: states.message || acc.message,
              };
            },
            { ...EMPTY_VALIDATION_STATE }
          )
        );
      };
      updateValidationState({ isValidating: true });
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = await validate(fieldValue, depValues as any, fieldApi);
        updateValidationState({ isValidating: false, isValid: error === undefined, message: error });
      } catch (e) {
        updateValidationState({
          isValidating: false,
          isValid: false,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    };
    const subscribeOptions = {
      listener: () => {
        this.queueValidateFunctions(validateFn);
      },
      // 校验器订阅忽略重置值的场景
      ignoreReset: true,
    };
    const subscribes: UnSubscribeFn[] = [
      // 自身值的变更一定触发
      this.subscribeField(key, 'value', subscribeOptions),
    ];
    if (!validator.deps) {
      // 没有声明依赖的，任何值变更都要触发校验
      subscribes.push(this.subscribeField('.', 'value', subscribeOptions));
    } else {
      // 根据依赖做过滤
      // 当前 key 对应的值变更了都要校验，和依赖声明无关
      const depsWithoutCurrentKey = [...new Set(validator.deps.filter((dep) => dep !== key))];
      depsWithoutCurrentKey.forEach((depKey) => {
        subscribes.push(this.subscribeField(depKey, 'value', subscribeOptions));
      });
    }
    this.setCompiledValidator(key, validator, {
      validateFn,
      validationStates,
      subscribes,
    });
  };

  private queueValidateFunctions = (fn: ValidateFn) => {
    const queueIsEmpty = this.validateFunctionsQueue.size === 0;
    this.validateFunctionsQueue.add(fn);
    if (queueIsEmpty) {
      // should flush later
      setTimeout(() => {
        this.validateFunctionsQueue.forEach((_fn) => _fn());
        this.validateFunctionsQueue.clear();
      });
    }
  };

  private recompileValidators = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shouldRetainValidators: [string, FormValidator<T, any>][] = [];
    // compile 所有 validators，如果已经存在的，会跳过
    Object.entries(this.validators.state).forEach((entry) => {
      const [key, validators] = entry as [DeepKeys<T>, FormValidator<T, DeepKeys<T>>[] | undefined];
      validators?.forEach((validator) => {
        shouldRetainValidators.push([key, validator]);
        if (this.getCompiledValidator(key, validator)) {
          return;
        }
        this.compileValidator(key, validator);
      });
    });
    // 清理掉移除了的校验器
    this.compiledValidators.forEach((validatorsMap, key) => {
      validatorsMap.forEach((compiledValidator, validator) => {
        if (shouldRetainValidators.find((v) => v[0] === key && v[1] === validator)) {
          return;
        }
        this.deleteCompiledValidator(key, validator);
      });
    });
  };

  getValidationState = (key: DeepKeys<T>): FormValidationState =>
    this.validationStates.state[key] ?? { ...EMPTY_VALIDATION_STATE };

  getField = <Key extends DeepKeys<T>>(key: Key): FieldApi<T, Key> => new FieldApiImpl(key, this);

  getValue = <Key extends DeepKeys<T>>(key: Key): DeepValue<T, Key> => {
    if (key === '.') {
      return this.values.state as DeepValue<T, Key>;
    }
    return get(this.values.state, key) as DeepValue<T, Key>;
  };

  getValues = (): T => this.values.state;

  setValidationState = (key: DeepKeys<T>, updater: StateUpdater<FormValidationState>): void => {
    this.validationStates.update((prev) => {
      return {
        ...prev,
        [key]: updateState(prev[key] ?? { ...EMPTY_VALIDATION_STATE }, updater),
      };
    });
  };

  setValidationStates = (updater: StateUpdater<FormErrorsMap<T>>): void => {
    this.validationStates.update(updater);
  };

  setValidators = (updater: StateUpdater<FormValidatorsMap<T>>): void => {
    this.validators.update(updater);
  };

  setValue = <Key extends DeepKeys<T>>(key: Key, updater: StateUpdater<DeepValue<T, Key>>): void => {
    this.values.update((prev) => {
      if (key === '.') {
        return updateState(prev, updater as StateUpdater<DeepValue<T, '.'>>);
      }
      return immer.produce(prev, (draft) => {
        if (draft && (Array.isArray(draft) || typeof draft === 'object')) {
          set(draft, key, updateState(this.getValue(key), updater));
          return draft;
        }
        return draft;
      });
    });
  };

  setValues = (updater: StateUpdater<T>): void => {
    this.values.update(updater);
  };

  getValidationStates = (): FormValidateResult<T> => {
    const states = Object.values(this.validationStates.state) as FormValidationState[];
    return {
      errors: this.validationStates.state,
      isValid: states.every((state) => state.isValid),
      isValidating: states.some((state) => state.isValidating),
    };
  };

  async validate(): Promise<FormValidateResult<T>>;
  async validate(key: DeepKeys<T>): Promise<FormValidationState>;
  async validate(key?: DeepKeys<T>): Promise<FormValidateResult<T> | FormValidationState> {
    // 主动触发的校验逻辑不需要加入队列，这里直接 promise.all 来执行，并将执行结果返回
    const willRunValidators = new Set<CompiledValidator>();

    const runValidate = async () => {
      await Promise.all(
        [...willRunValidators.values()].map(async (fn) => {
          await fn.validateFn();
        })
      );
    };

    if (key !== undefined) {
      // 触发单个字段的校验器
      const compiledValidatorsMap = this.compiledValidators.get(key);
      if (compiledValidatorsMap) {
        [...compiledValidatorsMap.values()].forEach((v) => willRunValidators.add(v));
        await runValidate();
        return this.getValidationState(key);
      }
      return { ...EMPTY_VALIDATION_STATE };
    }
    // 触发所有字段的校验器，包含被动触发的校验器
    [...this.compiledValidators.values()].forEach((validators) => {
      [...validators.values()].forEach((v) => willRunValidators.add(v));
    });
    await runValidate();
    return this.getValidationStates();
  }

  submit = async (
    onSuccess: (values: T) => void,
    onError?: (errors: FormErrorsMap<T>) => void
  ): Promise<boolean> => {
    const { errors, isValid } = await this.validate();
    if (isValid) {
      onSuccess?.(this.getValues());
      return true;
    }
    onError?.(errors);
    return false;
  };

  subscribe<V>(type: 'values', options: SubscribeOptions<T, V>): UnSubscribeFn;
  subscribe<V>(type: 'errors', options: SubscribeOptions<FormErrorsMap<T>, V>): UnSubscribeFn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(type: 'values' | 'errors', options: SubscribeOptions<any, any>): UnSubscribeFn {
    switch (type) {
      case 'errors': {
        const unsubscribe = this.validationStates.subscribe(options);
        this.subscribes.push(unsubscribe);
        return unsubscribe;
      }
      case 'values': {
        const unsubscribe = this.values.subscribe(options);
        this.subscribes.push(unsubscribe);
        return unsubscribe;
      }
    }
  }

  subscribeField<Key extends DeepKeys<T>>(
    key: Key,
    type: 'value',
    options: Omit<SubscribeOptions<DeepValue<T, Key>, DeepValue<T, Key>>, 'selector'>
  ): UnSubscribeFn;
  subscribeField<Key extends DeepKeys<T>>(
    key: Key,
    type: 'error',
    options: Omit<SubscribeOptions<FormValidationError, FormValidationError>, 'selector'>
  ): UnSubscribeFn;
  subscribeField<Key extends DeepKeys<T>>(
    key: Key,
    type: 'value' | 'error',
    options: Omit<SubscribeOptions<unknown, unknown>, 'selector'>
  ): UnSubscribeFn;
  subscribeField<Key extends DeepKeys<T>>(
    key: Key,
    type: 'value' | 'error',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: Omit<SubscribeOptions<any, any>, 'selector'>
  ): UnSubscribeFn {
    switch (type) {
      case 'value': {
        return this.subscribe('values', {
          ...options,
          selector: () => this.getValue(key),
        });
      }
      case 'error': {
        return this.subscribe('errors', {
          ...options,
          selector: (errors) => errors[key],
        });
      }
    }
  }

  reset = (): void => {
    // 表单重置仅清理 values 和 errors
    this.validationStates.reset();
    this.values.reset();
  };

  destroy = (): void => {
    // 清理所有缓存、引用和订阅器
    this.validationStates.clear();
    this.values.clear();
    this.validators.clear();
    this.compiledValidators.clear();
    this.subscribes.forEach((unsubscribe) => unsubscribe());
    this.subscribes = [];
    this.validateFunctionsQueue.clear();
  };
}
