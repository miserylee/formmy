# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commonly Used Commands
- **Run Development Server**: `npm run dev` (starts the example project in packages/example)
- **Publish Packages**: `npm run publish` (uses lerna to publish packages)

## High-Level Code Architecture
- **Core Purpose**: formmy is a UI-agnostic form helper library focused on type safety, flexible validation, and event-driven state management.
- **Key Features**: 
  - Advanced type inference for form fields (up to 5 levels deep)
  - Configurable validators (form/field-level, value-dependent, async)
  - Event subscription for value/error changes
- **Important Entry Points**: 
  - Core logic: `@formmy/core` (see packages/core/README.md)
  - React example: `packages/example/src/examples/LoginForm.tsx`