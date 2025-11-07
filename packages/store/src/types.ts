// 订阅器相关的类型定义
export type Listener<T> = (state: T) => void;
export type Selector<T, V> = (state: T) => V;
export type SubscribeOptions<T, V> = {
  listener: Listener<V>;
  selector?: Selector<T, V>;
  immediate?: boolean;
  ignoreReset?: boolean;
  isValueChanged?: (prev: V, current: V) => boolean;
  // debounce 和 immediate 存在定位上的冲突，如果设置了 debounce，immediate 会失效
  debounce?: number;
};
export type UnSubscribeFn = () => void;

export type StateUpdater<T> = T | ((prev: T) => T);
