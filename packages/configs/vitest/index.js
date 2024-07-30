process.env.VITE_CJS_IGNORE_WARNING = 'true';

/* eslint-disable @typescript-eslint/no-var-requires */
const { mergeConfig } = require('vitest/config');
const path = require('path');
const tsconfigPaths = require('vite-tsconfig-paths').default;

function resolveToInner(deps) {
  return deps.map((dep) => {
    return {
      find: dep,
      replacement: path.dirname(require.resolve(`${dep}/package.json`)),
    };
  });
}

exports.defineVitestConfig = (config) => {
  return mergeConfig(
    {
      esbuild: {
        jsx: 'automatic',
      },
      resolve: {
        // 优先识别 main，如果没有配置 main，则识别 module
        mainFields: [`main`, `module`],
        alias: resolveToInner([
          // @NOTE: 以下 alias 是为了保证版本全局统一
          '@vitest/coverage-v8',
          'happy-dom',
        ]),
      },
      build: {
        commonjsOptions: {
          transformMixedEsModules: true,
        },
      },
      plugins: [tsconfigPaths()],
      poolOptions: {
        vmThreads: {
          memoryLimit: '4G',
        },
      },
      test: {
        passWithNoTests: true,
        globals: true,
        mockReset: false,
        environment: 'happy-dom',
        include: ['**/?(*.){test,spec}.?(c|m)[jt]s?(x)'],
        exclude: ['**/{node_modules,dist,lib}/**', '**/.*/**'],
        coverage: {
          provider: 'v8',
          reporter: ['cobertura', 'text', 'html', 'clover', 'json'],
          all: process.env.COVERAGE_ALL ?? true,
          include: ['src/**'],
        },
      },
    },
    config
  );
};
