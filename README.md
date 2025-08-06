# formmy

[![npm version](https://img.shields.io/npm/v/@formmy/core.svg)](https://www.npmjs.com/package/@formmy/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个轻量级、类型安全的表单库，核心逻辑零依赖。使用 TypeScript 构建，设计为框架无关，同时为 React 提供一流支持。

## ✨ 特性

- **类型安全**：支持最多 5 层嵌套结构的深度类型推导
- **灵活验证**：支持表单级和字段级验证，包含异步验证
- **事件驱动**：可在任意层级订阅值和错误变化
- **框架无关**：核心逻辑可在任何 JavaScript 环境运行
- **React 集成**：为 React 应用提供简洁的钩子 API
- **零依赖**：核心包无运行时依赖

## 📦 包结构

| 包名 | 描述 | 版本 |
|---------|-------------|---------|
| [`@formmy/core`](packages/core) | 框架无关的核心逻辑 | [![npm](https://img.shields.io/npm/v/@formmy/core.svg)](https://www.npmjs.com/package/@formmy/core) |
| [`@formmy/react`](packages/react) | React 钩子和组件 | [![npm](https://img.shields.io/npm/v/@formmy/react.svg)](https://www.npmjs.com/package/@formmy/react) |
| [`@formmy/store`](packages/store) | 轻量级状态管理 | [![npm](https://img.shields.io/npm/v/@formmy/store.svg)](https://www.npmjs.com/package/@formmy/store) |

## 🚀 快速开始

### 安装

```bash
npm install @formmy/core @formmy/react
```

### 基础用法

```typescript
import { FormApi } from '@formmy/core';

interface FormValues {
  username: string;
  password: string;
}

const form = new FormApi<FormValues>({
  initialValues: {
    username: '',
    password: '',
  },
  validators: {
    username: [(v) => !v ? '用户名为必填项' : undefined],
    password: [(v) => !v ? '密码为必填项' : undefined],
  },
});

// 订阅变化
const unsubscribe = form.subscribe('values', {
  selector: (state) => state.username,
  listener: (value) => console.log('用户名:', value),
});

// 验证并提交
const success = await form.submit(
  (values) => console.log('成功:', values),
  (errors) => console.log('错误:', errors)
);
```

### React 集成

```typescript
import { getFormFactory } from '@formmy/react';

interface LoginFormValues {
  username: string;
  password: string;
}

const factory = getFormFactory<LoginFormValues>();

function LoginForm() {
  return (
    <factory.Form initialValues={{ username: '', password: '' }}>
      <factory.Field
        fieldKey="username"
        validators={(value) => !value ? '用户名为必填项' : undefined}
      >
        {(field) => (
          <input
            value={field.getValue()}
            onChange={(e) => field.setValue(e.target.value)}
            onBlur={field.validate}
          />
        )}
      </factory.Field>
    </factory.Form>
  );
}
```

## 📖 文档

- [核心 API 参考](packages/core/README.md)
- [React 示例](packages/example/src/examples/)

## 🏗️ 开发

本项目使用 Lerna 和 pnpm 管理的 monorepo 结构。

```bash
# 安装依赖
pnpm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test --workspace=@formmy/core

# 构建包
npm run build --workspace=@formmy/core
```

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📄 许可证

MIT © [MiseryLee](https://github.com/miserylee)

---

**English Version**: [README.en.md](README.en.md)
