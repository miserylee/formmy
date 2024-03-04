// 订阅器相关的类型定义
export type Listener<T> = (state: T) => void;
export type Selector<T, V> = (state: T) => V;
export type SubscribeOptions<T, V> = {
  listener: Listener<V>;
  selector?: Selector<T, V>;
  immediate?: boolean;
  ignoreReset?: boolean;
};
export type UnSubscribeFn = () => void;

export type StateUpdater<T> = T | ((prev: T) => T);
