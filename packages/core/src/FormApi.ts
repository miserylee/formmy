import Store, {
  updateState,
  type StateUpdater,
  type UnSubscribeFn,
  type SubscribeOptions,
} from '@formmy/store';
import { Immer } from 'immer';
import get from 'lodash.get';
import set from 'lodash.set';

import { FieldApi } from './FieldApi';
import { SubFormApi } from './SubFormApi';
import {
  type CreateFormOptions,
  type DeepKeys,
  type DeepValue,
  type IFieldApi,
  type IFormApi,
  type FormErrorsMap,
  type FormValidateResult,
  type FormValidationError,
  type FormValidationState,
  type FormValidator,
  type FormValidatorsMap,
  type FormValidatorWithDeps,
  type FormInteraction,
  type CreateSubFormOptions,
  type ValidateFn,
  EMPTY_VALIDATION_STATE,
  type CompiledValidator,
} from './types';

const immer = new Immer({ autoFreeze: false });

export class FormApi<T> implements IFormApi<T> {
  private validators: Store<FormValidatorsMap<T>>;
  private values: Store<T>;
  private validationStates: Store<FormErrorsMap<T>>;
  private interactions: Store<FormInteraction<T>[]>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private compiledValidators = new Map<string, Map<FormValidator<T, any>, CompiledValidator>>();
  private validateFunctionsQueue = new Set<ValidateFn>();

  private interactionSubscribes: UnSubscribeFn[] = [];
  private interactionQueue = new Set<FormInteraction<T>['action']>();
  private cycleInteractionDetectingQueue: string[] = [];
  private cycleInteractionDetectingTimer?: NodeJS.Timeout;
  private cycleInteractionDetected = false;

  private subscribes: UnSubscribeFn[] = [];

  constructor(private options: CreateFormOptions<T>) {
    this.validate = this.validate.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.subscribeField = this.subscribeField.bind(this);
    this.submit = this.submit.bind(this);

    // 初始化 store
    this.validationStates = new Store({});
    this.values = new Store(this.options.initialValues);
    this.validators = new Store(this.options.validators ?? {});
    this.interactions = new Store(this.options.interactions ?? []);

    // 初始化编译一次校验器
    this.recompileValidators();
    // 当校验器发生变更时，重新编译校验器
    this.validators.subscribe({
      listener: () => this.recompileValidators(),
      immediate: true,
    });

    // 初始编译一次联动器
    this.recompileInteractions();
    // 当联动器发生变更时，重新编译联动器
    this.interactions.subscribe({
      listener: () => this.recompileInteractions(),
      immediate: true,
    });
  }

  private queueInteractions = (fn: FormInteraction<T>['action'], depKey: DeepKeys<T>) => {
    const queueIsEmpty = this.interactionQueue.size === 0;
    this.interactionQueue.add(fn);
    if (queueIsEmpty) {
      // should flush later
      setTimeout(() => {
        this.interactionQueue.forEach((_fn) => _fn(this));
        this.interactionQueue.clear();
      });
    }

    // 如果已经检测出过循环联动，则不再继续检测
    if (this.cycleInteractionDetected) {
      return;
    }
    // 循环联动检测，在 debounce 窗口内，如果检测队列中出现了同一个 depKey 超过 50 次，则认为存在循环联动
    if (this.cycleInteractionDetectingQueue.filter((key) => key === depKey).length >= 50) {
      // 循环联动有可能是业务预期内的行为，因此这里仅进行 warning 提示即可
      console.warn(`Detected cycle interactions with depKey: ${depKey}`);
      this.cycleInteractionDetected = true;
    } else {
      // 将本次 depKey 推入检测队列，debounce 清空队列的逻辑
      this.cycleInteractionDetectingQueue.push(depKey);
      clearTimeout(this.cycleInteractionDetectingTimer);
      this.cycleInteractionDetectingTimer = setTimeout(() => {
        clearTimeout(this.cycleInteractionDetectingTimer);
        this.cycleInteractionDetectingQueue = [];
      }, 16);
    }
  };

  private recompileInteractions = () => {
    // 先取消之前的所有监听器，重新构造监听
    this.interactionSubscribes.forEach((unsub) => unsub());
    this.interactions.state.forEach((interaction) => {
      interaction.deps.forEach((depKey) => {
        this.interactionSubscribes.push(
          this.subscribeField(depKey, 'value', {
            listener: () => {
              // 联动函数推入队列
              this.queueInteractions(interaction.action, depKey);
            },
            // 联动器订阅忽略重置值的场景
            ignoreReset: true,
          })
        );
      });
    });
  };

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
    let _validator: FormValidatorWithDeps<T, Key>;
    if (typeof validator === 'function') {
      _validator = {
        validate: validator,
        deps: [],
      };
    } else {
      _validator = validator;
    }
    const validationStates = { ...EMPTY_VALIDATION_STATE };
    const fieldApi = this.getField(key);
    const validateFn = async () => {
      const fieldValue = this.getValue(key);
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
        const error = await _validator.validate(fieldValue, fieldApi);
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
    const subscribes: UnSubscribeFn[] = [];
    if (!_validator.obtuse) {
      subscribes.push(this.subscribeField(key, 'value', subscribeOptions));
    }
    if (!_validator.deps) {
      // 没有声明依赖的，任何值变更都要触发校验
      subscribes.push(this.subscribeField('.', 'value', subscribeOptions));
    } else {
      // 根据依赖做过滤
      // 当前 key 对应的值变更了都要校验，和依赖声明无关
      const depsWithoutCurrentKey = [...new Set(_validator.deps.filter((dep) => dep !== key))];
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
        const allValidateFns = [...this.compiledValidators.values()].flatMap((subMap) =>
          [...subMap.values()].map((compiledValidator) => compiledValidator.validateFn)
        );
        this.validateFunctionsQueue.forEach((_fn) => {
          if (!allValidateFns.includes(_fn)) {
            // 如果在执行校验函数时，该校验函数已经卸载，则跳过
            return;
          }
          _fn();
        });
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

  getField = <Key extends DeepKeys<T>>(key: Key): IFieldApi<T, Key> => new FieldApi<T, Key>(key, this);

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

  resetValidationStates = (): void => {
    this.validationStates.reset();
  };

  resetValidationState = (key: DeepKeys<T>): void => {
    this.validationStates.update((prev) => {
      const next = { ...prev };
      Reflect.deleteProperty(next, key);
      return next;
    });
  };

  setValidators = (updater: StateUpdater<FormValidatorsMap<T>>): void => {
    this.validators.update(updater);
  };

  setInteractions = (updater: StateUpdater<FormInteraction<T>[]>): void => {
    this.interactions.update(updater);
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
      // 先重置该字段的校验状态
      this.resetValidationState(key);
      // 触发单个字段的校验器
      const compiledValidatorsMap = this.compiledValidators.get(key);
      if (compiledValidatorsMap) {
        [...compiledValidatorsMap.values()].forEach((v) => willRunValidators.add(v));
        await runValidate();
        return this.getValidationState(key);
      }
      return { ...EMPTY_VALIDATION_STATE };
    }
    // 先重置所有校验状态
    this.resetValidationStates();
    // 触发所有字段的校验器，包含被动触发的校验器
    [...this.compiledValidators.values()].forEach((validators) => {
      [...validators.values()].forEach((v) => willRunValidators.add(v));
    });
    await runValidate();
    return this.getValidationStates();
  }

  submit(): Promise<T>;
  submit(onSuccess: (values: T) => void, onError?: (errors: FormErrorsMap<T>) => void): Promise<boolean>;
  async submit(
    onSuccess?: (values: T) => void,
    onError?: (errors: FormErrorsMap<T>) => void
  ): Promise<boolean | T> {
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

  subscribe<V = T>(type: 'values', options: SubscribeOptions<T, V>): UnSubscribeFn;
  subscribe<V = T>(type: 'errors', options: SubscribeOptions<FormErrorsMap<T>, V>): UnSubscribeFn;
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
    this.interactionSubscribes.forEach((unsub) => unsub());
    this.interactionQueue.clear();
    this.interactions.clear();
    this.cycleInteractionDetectingQueue = [];
  };

  // 获取子表单实例
  getSubForm = <Prefix extends DeepKeys<T>>(
    options: Omit<CreateSubFormOptions<T, Prefix>, 'formApi'>
  ): IFormApi<DeepValue<T, Prefix>> => {
    return new SubFormApi<T, Prefix>({
      ...options,
      formApi: this,
    });
  };
}
