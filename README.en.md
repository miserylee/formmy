# formmy

[![npm version](https://img.shields.io/npm/v/@formmy/core.svg)](https://www.npmjs.com/package/@formmy/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, type-safe form library with zero dependencies for the core logic. Built with TypeScript and designed to be framework-agnostic while providing first-class React support.

## ✨ Features

- **Type Safety**: Deep type inference up to 5 levels of nesting
- **Flexible Validation**: Form-level and field-level validation with async support
- **Event-Driven**: Subscribe to value and error changes at any level
- **Framework Agnostic**: Core logic works in any JavaScript environment
- **React Integration**: Clean, hook-based API for React applications
- **Zero Dependencies**: Core package has no runtime dependencies

## 📦 Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@formmy/core`](packages/core) | Framework-agnostic core logic | [![npm](https://img.shields.io/npm/v/@formmy/core.svg)](https://www.npmjs.com/package/@formmy/core) |
| [`@formmy/react`](packages/react) | React hooks and components | [![npm](https://img.shields.io/npm/v/@formmy/react.svg)](https://www.npmjs.com/package/@formmy/react) |
| [`@formmy/store`](packages/store) | Lightweight state management | [![npm](https://img.shields.io/npm/v/@formmy/store.svg)](https://www.npmjs.com/package/@formmy/store) |

## 🚀 Quick Start

### Installation

```bash
npm install @formmy/core @formmy/react
```

### Basic Usage

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
    username: [(v) => !v ? 'Username is required' : undefined],
    password: [(v) => !v ? 'Password is required' : undefined],
  },
});

// Subscribe to changes
const unsubscribe = form.subscribe('values', {
  selector: (state) => state.username,
  listener: (value) => console.log('Username:', value),
});

// Validate and submit
const success = await form.submit(
  (values) => console.log('Success:', values),
  (errors) => console.log('Errors:', errors)
);
```

### React Integration

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
        validators={(value) => !value ? 'Username required' : undefined}
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

## 📖 Documentation

- [Core API Reference](packages/core/README.md)
- [React Examples](packages/example/src/examples/)

## 🏗️ Development

This project uses a monorepo structure managed with Lerna and pnpm.

```bash
# Install dependencies
pnpm install

# Start development server
npm run dev

# Run tests
npm run test --workspace=@formmy/core

# Build packages
npm run build --workspace=@formmy/core
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [MiseryLee](https://github.com/miserylee)

---

**中文版本**: [README.md](README.md)
