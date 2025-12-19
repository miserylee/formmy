# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.1](https://github.com/miserylee/formmy/compare/v1.1.0...v1.1.1) (2025-12-19)

### Bug Fixes

* obtuse not working when deps is not empty in validators ([ef9b541](https://github.com/miserylee/formmy/commit/ef9b541eda4e6bdad5010fbde4591f32fb5e75bb))

# [1.1.0](https://github.com/miserylee/formmy/compare/v1.0.2...v1.1.0) (2025-11-07)

### Features

* 校验器支持设置 debounce; 校验函数在触发结束时需要做时序判断避免状态混乱 ([425d07f](https://github.com/miserylee/formmy/commit/425d07f1cae6631d687c7e2178e714a5fc4d6871))

## [1.0.1](https://github.com/miserylee/formmy/compare/v1.0.0...v1.0.1) (2025-11-06)

### Bug Fixes

* add getKey method to FieldApi and improve Field component props ([28b834a](https://github.com/miserylee/formmy/commit/28b834a29afac708263bdfc3ab59f1030b3436c2))

# [1.0.0](https://github.com/miserylee/formmy/compare/v0.14.1...v1.0.0) (2025-10-27)

**Note:** Version bump only for package @formmy/core

## [0.14.1](https://github.com/miserylee/formmy/compare/v0.14.0...v0.14.1) (2025-05-14)

### Bug Fixes

* not update any states after destroyed ([c3af3bd](https://github.com/miserylee/formmy/commit/c3af3bd996552dfa6af6c1db60ff0e51d37155d3))

# [0.14.0](https://github.com/miserylee/formmy/compare/v0.13.3...v0.14.0) (2025-05-13)

### Features

* add retainValidationStatesWhenDestroy in Field props ([7070b54](https://github.com/miserylee/formmy/commit/7070b54ca9e5e67ba65219f53bea5c57ecbe9b3a))

## [0.13.3](https://github.com/miserylee/formmy/compare/v0.13.2...v0.13.3) (2025-05-08)

### Bug Fixes

* setValidators in sub form may lost other validators ([4915183](https://github.com/miserylee/formmy/commit/49151831d5dd684c114ba603777474bb36d8020d))

## [0.13.2](https://github.com/miserylee/formmy/compare/v0.13.1...v0.13.2) (2025-05-08)

### Bug Fixes

* cannot access validators in sub form when it set from main form ([46114bb](https://github.com/miserylee/formmy/commit/46114bb71113ab7d7ae2d062af0ece04bfb02d2a))

## [0.13.1](https://github.com/miserylee/formmy/compare/v0.13.0...v0.13.1) (2025-05-08)

### Bug Fixes

* should use final message when merge validation states ([d9d7bf8](https://github.com/miserylee/formmy/commit/d9d7bf84067a0b32c6c532f04624e090abfbb196))

# [0.13.0](https://github.com/miserylee/formmy/compare/v0.12.4...v0.13.0) (2025-05-07)

### Features

* support form binding ([b66a33e](https://github.com/miserylee/formmy/commit/b66a33e927bcff71e1081a7470f0ef10ad82371b))

## [0.12.4](https://github.com/miserylee/formmy/compare/v0.12.3...v0.12.4) (2025-05-07)

### Bug Fixes

* add isValueChanged for subscribe selector ([b635e62](https://github.com/miserylee/formmy/commit/b635e629600e982ab0185875b716b334acf79bd4))

## [0.12.3](https://github.com/miserylee/formmy/compare/v0.12.2...v0.12.3) (2025-05-06)

### Bug Fixes

* some value of entries may be undefined ([ae31524](https://github.com/miserylee/formmy/commit/ae31524f84fe0e6f27d3b2b4db7f5f3cbba0dcea))

## [0.12.1](https://github.com/miserylee/formmy/compare/v0.12.0...v0.12.1) (2025-05-06)

### Bug Fixes

* add tsconfig.build.json ([f28fcd6](https://github.com/miserylee/formmy/commit/f28fcd66850d043b2bbcf0c747d302c30e2cf162))

# [0.12.0](https://github.com/miserylee/formmy/compare/v0.10.1...v0.12.0) (2025-04-30)

### Features

* add SubFormApi ([a3563c3](https://github.com/miserylee/formmy/commit/a3563c3cce97536da2c8441b25ea3f5691810a44))

## [0.10.1](https://github.com/miserylee/formmy/compare/v0.10.0...v0.10.1) (2025-03-17)

### Bug Fixes

* skip queued validate fn when it already removed from compiled validators ([0359842](https://github.com/miserylee/formmy/commit/03598421aedb262049ff1795dc59f5e055cc4317))

# [0.10.0](https://github.com/miserylee/formmy/compare/v0.9.0...v0.10.0) (2025-02-08)

### Features

* submit returns form values if callback not provides ([ad27134](https://github.com/miserylee/formmy/commit/ad27134b6a5d896bae14536dbdf5046de3daee8f))

# [0.9.0](https://github.com/miserylee/formmy/compare/v0.8.0...v0.9.0) (2025-01-16)

### Features

* support obtuse validator ([f30781b](https://github.com/miserylee/formmy/commit/f30781b9d7506237494af39a441ac1403c809f6b))

# [0.8.0](https://github.com/miserylee/formmy/compare/v0.7.0...v0.8.0) (2025-01-10)

### Features

* form interaction ([f441456](https://github.com/miserylee/formmy/commit/f4414569b5ca8ecad18f4184847d48992de6eddf))

# [0.7.0](https://github.com/miserylee/formmy/compare/v0.6.3...v0.7.0) (2024-12-31)

### Features

* support resetValidationState ([a44407f](https://github.com/miserylee/formmy/commit/a44407fe2d6b7654d67ae336f86dc9590c95fc71))

## [0.6.2](https://github.com/miserylee/formmy/compare/v0.6.1...v0.6.2) (2024-11-14)

**Note:** Version bump only for package @formmy/core

## [0.6.1](https://github.com/miserylee/formmy/compare/v0.6.0...v0.6.1) (2024-11-11)

**Note:** Version bump only for package @formmy/core

# [0.6.0](https://github.com/miserylee/formmy/compare/v0.5.2...v0.6.0) (2024-11-07)

**Note:** Version bump only for package @formmy/core

# [0.5.0](https://github.com/miserylee/formmy/compare/v0.4.0...v0.5.0) (2024-10-31)

**Note:** Version bump only for package @formmy/core

# [0.4.0](https://github.com/miserylee/formmy/compare/v0.3.0...v0.4.0) (2024-10-17)

### Features

* optimize validators ([f43cfba](https://github.com/miserylee/formmy/commit/f43cfba28c5fc0d88588858e41f7433d6f4a57c5))

# [0.3.0](https://github.com/miserylee/formmy/compare/v0.2.11...v0.3.0) (2024-10-15)

### Features

* add IPureFieldApi interface ([ab9e112](https://github.com/miserylee/formmy/commit/ab9e112ec3288eb41977a8c9a9ba5825ee6b780f))

## [0.2.11](https://github.com/miserylee/formmy/compare/v0.2.10...v0.2.11) (2024-10-11)

**Note:** Version bump only for package @formmy/core

## [0.2.10](https://github.com/miserylee/formmy/compare/v0.2.9...v0.2.10) (2024-08-02)

**Note:** Version bump only for package @formmy/core

## [0.2.9](https://github.com/miserylee/formmy/compare/v0.2.8...v0.2.9) (2024-08-02)

**Note:** Version bump only for package @formmy/core

## [0.2.8](https://github.com/miserylee/formmy/compare/v0.2.7...v0.2.8) (2024-08-01)

**Note:** Version bump only for package @formmy/core

## [0.2.7](https://github.com/miserylee/formmy/compare/v0.2.6...v0.2.7) (2024-08-01)

**Note:** Version bump only for package @formmy/core

## [0.2.6](https://github.com/miserylee/formmy/compare/v0.2.5...v0.2.6) (2024-08-01)

**Note:** Version bump only for package @formmy/core

## [0.2.5](https://github.com/miserylee/formmy/compare/v0.2.4...v0.2.5) (2024-07-30)

**Note:** Version bump only for package @formmy/core

## [0.2.4](https://github.com/miserylee/formmy/compare/v0.2.3...v0.2.4) (2024-07-30)

**Note:** Version bump only for package @formmy/core

## [0.2.3](https://github.com/miserylee/formmy/compare/v0.2.2...v0.2.3) (2024-07-26)

**Note:** Version bump only for package @formmy/core

## [0.2.2](https://github.com/miserylee/formmy/compare/v0.2.1...v0.2.2) (2024-07-24)

**Note:** Version bump only for package @formmy/core

## [0.2.1](https://github.com/miserylee/formmy/compare/v0.2.0...v0.2.1) (2024-07-24)

**Note:** Version bump only for package @formmy/core

# [0.2.0](https://github.com/miserylee/formmy/compare/v0.1.2...v0.2.0) (2024-07-23)

### Bug Fixes

* eslintrc files ([2f12114](https://github.com/miserylee/formmy/commit/2f12114f2ba40c299d697ba6d4d9cb26a986b936))

### Features

* core ([9d9e1e1](https://github.com/miserylee/formmy/commit/9d9e1e16210465f987b340a690bebf06f622d3ac))
* react adapter ([15e67ba](https://github.com/miserylee/formmy/commit/15e67ba11ca0eae6a217c0e75363b35ccec493f7))

## [0.1.2](https://github.com/miserylee/formmy/compare/v0.1.1...v0.1.2) (2024-03-26)

**Note:** Version bump only for package @formmy/core

## [0.1.1](https://github.com/miserylee/formmy/compare/v0.1.0...v0.1.1) (2024-03-04)

**Note:** Version bump only for package @formmy/core

# 0.1.0 (2024-03-04)

### Features

* add store implementations ([ad47132](https://github.com/miserylee/formmy/commit/ad47132615f212d993944961e1a46afee36e844d))
