# `@formmy/store`

这是一个为 formmy 设计的状态管理类，它具有以下特性：
- 在设计上它是和 formmy 解耦的，可以被用在任何合适的场景中
- 更新状态的方法支持直接设置值，也支持 reducer 的方式更新
- 值变更的监听器可以是同步或者异步的
- 支持进行状态重置，恢复到初始状态
- 接口设计友好，类型完备

## Usage

```typescript
import Store, { updateState } from '@formmy/store';

// 创建 store
const store = new Store({ username: '', password: '' });

// 获取 state
console.log(store.state);

// 监听值变更
store.subscribe({
  // 值选择器，不传时直接选择完整的 state
  selector: (state) => state.username,
  listener: (value) => {
    // 值变更时触发回调，会进行浅比较来避免无谓的更新
  },
  // 是否立即触发，默认为 false，即异步触发
  immediate: true,
  // 是否忽略 reset 引起的值变更，默认为 false
  ignoreReset: true,
});

// 更新值
store.update({ username: 'Lee', password: '123456' });
// reducer 的方式更新值
store.update((prev) => ({
  ...prev,
  username: 'MiseryLee',
}));

// 重置状态到初始值
store.reset();

// 清空监听器
store.clear();

// 帮助函数，使用 reducer 函数来进行对象更新
updateState({ foo: 'bar' }, (prev) => ({
  ...prev,
  foo: 'baz',
}));

//
```
