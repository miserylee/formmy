# `@formmy/core`

formmy 是一个简单够用的表单辅助库，它具有以下特性：
- 完善的类型推导能力，能够根据至多下钻 5 层结构并正确推导字段数据类型
- 灵活的校验器配置，可以在表单维度或者字段维度进行配置，支持配置值依赖、异步校验等
- 支持订阅表单或字段的值、校验错误变化事件，拓展定制化的回调逻辑
- 完善且友好的 api 设计，几乎零门槛上手使用
- UI 无关，可以在任何支持 js 运行的环境下使用

## Usage

```typescript
import { FormApi } from '@formmy/core';

interface FormValues {
  username: string;
  password: string;
}

const form = new FormApi({
  initialValues: {
    username: '',
    password: '',
  },
  validators: {
    username: [
      {
        validate: (v) => (!v ? 'username is required' : undefined),
        deps: [],
      },
    ],
    password: [
      {
        validate: (v) => (!v ? 'password is required' : undefined),
        deps: [],
      },
      {
        validate: (v) => (v.length > 30 ? 'password more than 30 characters' : undefined),
      },
    ],
  },
});

// 更新字段值
form.getField('username').setValue('Lee');
form.getField('password').setValue('123456');

// 批量更新字段值
form.setValues((prev) => ({
  ...prev,
  username: 'MiseryLee',
}));

// 触发校验
await form.validate();
await form.validate('password');

// 提交
const isSuccess = await form.submit(
  (values) => {
    // 校验成功并获取到完整的表单值
    requestRemote(values);
  },
  (errors) => {
    // 校验失败并获取到失败信息
    handleError(errors);
  }
);

// 监听值变化
const unsub = form.subscribe('values', {
  // 选择监听，如果不传则监听整个表单
  selector: (state) => state.username,
  listener(values) {
    // 当表单值发生变化时触发回调
  },
  // 是否立即触发，默认为 false
  // 默认的触发逻辑是在一个事件循环中将所有触发事件合并，并在事件循环结束后一次性触发
  // 在特定的业务场景下，可能需要在值变更时立即同步触发
  immediate: true,
  // 是否忽略 reset 导致的变更事件
  ignoreReset: true,
});
// 解除监听
unsub();

// 监听校验结果
form.subscribe('errors', {
  listener(errors) {
    // 当校验结果变化时触发回调
  },
});

// 直接监听字段
form.subscribeField('username', 'value', {
  listener(value) {
    // 当字段值变化时触发回调
  },
});

// 重置表单到初始状态
form.reset();

// 销毁表单实例
// 这个行为会销毁这个表单实例中关联的所有换成、引用和订阅器
// 因此一旦实例被销毁后，此后的其他方法调用是无法正常工作的
form.destroy();

```
