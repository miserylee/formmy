import { type Listener, type StateUpdater, type SubscribeOptions, type UnSubscribeFn } from './types';

export * from './types';

function isShallowEquals(prev: unknown, current: unknown): boolean {
  if (prev === current) {
    return prev === current;
  }
  if (Array.isArray(prev) && Array.isArray(current)) {
    return prev.length === current.length && prev.every((item, index) => current[index] === item);
  }
  if (!!prev && !!current && typeof prev === 'object' && typeof current === 'object') {
    const prevKeys = Object.keys(prev);
    const currentKeys = Object.keys(current);
    return (
      prevKeys.length === currentKeys.length &&
      prevKeys.every((key) => Reflect.get(current, key) === Reflect.get(prev, key))
    );
  }
  return false;
}

export function updateState<T>(state: T, updater: StateUpdater<T>): T {
  if (updater instanceof Function) {
    return updater(state);
  }
  return updater;
}

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
    selector = (s) => s as unknown as V,
    listener,
    immediate,
    ignoreReset,
  }: SubscribeOptions<T, V>): UnSubscribeFn {
    let prevValue = selector(this.state);
    const callback: Listener<T> = (values) => {
      const currentValue = selector(values);
      const valueChanged = !isShallowEquals(prevValue, currentValue);
      // 先记录变化后的值，避免在触发 listener 的过程中再次触发该事件时，下次比较还是变更的，导致死循环的问题
      prevValue = currentValue;
      if (valueChanged) {
        listener(currentValue);
      }
    };
    const set = immediate ? this.immediateListeners : this.listeners;
    set.add(callback);
    if (ignoreReset) {
      this.ignoreResetListeners.add(callback);
    }
    return () => {
      set.delete(callback);
      this.ignoreResetListeners.delete(callback);
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
