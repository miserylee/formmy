import {
  type Listener,
  type Selector,
  type StateUpdater,
  type SubscribeOptions,
  type UnSubscribeFn,
} from './types';

export * from './types';

export function updateState<T>(state: T, updater: StateUpdater<T>): T {
  if (updater instanceof Function) {
    return updater(state);
  }
  return updater;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_SELECTOR: Selector<any, any> = (s) => s;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_IS_VALUE_CHANGED = (prev: any, current: any) => prev !== current;

export default class Store<T> {
  private listeners = new Set<Listener<T>>();
  private immediateListeners = new Set<Listener<T>>();
  private ignoreResetListeners = new Set<Listener<T>>();
  private _state: T;
  private queuedFlush = false;

  get state(): T {
    return this._state;
  }

  constructor(private initialState: T) {
    this._state = initialState;
  }

  subscribe<V = T>({
    selector = DEFAULT_SELECTOR,
    isValueChanged = DEFAULT_IS_VALUE_CHANGED,
    listener,
    immediate,
    ignoreReset,
    debounce,
  }: SubscribeOptions<T, V>): UnSubscribeFn {
    let prevValue = selector(this.state);
    const callback: Listener<T> = (values) => {
      const currentValue = selector(values);
      const valueChanged = isValueChanged(prevValue, currentValue);
      // 先记录变化后的值，避免在触发 listener 的过程中再次触发该事件时，下次比较还是变更的，导致死循环的问题
      prevValue = currentValue;
      if (valueChanged) {
        listener(currentValue);
      }
    };

    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedCallback: Listener<T> = (values) => {
      if (typeof debounce === 'number' && debounce > 0) {
        global.clearTimeout(debounceTimer);
        debounceTimer = global.setTimeout(() => callback(values), debounce);
      } else {
        callback(values);
      }
    };

    const set = immediate ? this.immediateListeners : this.listeners;
    set.add(debouncedCallback);
    if (ignoreReset) {
      this.ignoreResetListeners.add(debouncedCallback);
    }
    return () => {
      set.delete(debouncedCallback);
      this.ignoreResetListeners.delete(debouncedCallback);
    };
  }

  update(updater: StateUpdater<T>): void {
    this._state = updateState(this._state, updater);
    this.flush();
  }

  reset(): void {
    this._state = this.initialState;
    this.flush(true);
  }

  clear(): void {
    this.listeners.clear();
    this.immediateListeners.clear();
    this.ignoreResetListeners.clear();
  }

  private flush(reset?: boolean) {
    const callListener = (listener: Listener<T>) => {
      if (reset && this.ignoreResetListeners.has(listener)) {
        return;
      }
      listener(this.state);
    };

    /**
     * @NOTE 如果在 immediate listener 里面再次触发了更新，可能会导致死循环
     */
    this.immediateListeners.forEach(callListener);
    if (this.queuedFlush) {
      return;
    }
    this.queuedFlush = true;
    setTimeout(() => {
      this.queuedFlush = false;
      this.listeners.forEach(callListener);
    });
  }
}
