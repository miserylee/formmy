# formmy
📝 formmy 是一个简单够用的表单辅助库，它具有以下特性：
- 完善的类型推导能力，能够根据至多下钻 5 层结构并正确推导字段数据类型
- 灵活的校验器配置，可以在表单维度或者字段维度进行配置，支持配置值依赖、异步校验等
- 支持订阅表单或字段的值、校验错误变化事件，拓展定制化的回调逻辑
- 完善且友好的 api 设计，几乎零门槛上手使用
- UI 无关，可以在任何支持 js 运行的环境下使用


formmy 库在 React 框架下的使用方法参考示例：[React Example](https://github.com/miserylee/formmy/blob/main/packages/example/src/examples/LoginForm.tsx)  
核心 API 介绍：[@formmy/core](https://github.com/miserylee/formmy/blob/main/packages/core/README.md)
