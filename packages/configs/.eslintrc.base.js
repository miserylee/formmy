module.exports = {
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  plugins: ['@typescript-eslint', 'prettier', 'react', 'react-hooks', 'import', 'promise'],
  parser: '@typescript-eslint/parser',
  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules', 'src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      typescript: {
        project: process.cwd(),
      },
    },
  },
  ignorePatterns: ['**/lib/'],
  rules: {
    'prettier/prettier': ['warn', require('./.prettierrc.js'), { usePrettierrc: false }],
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        fixStyle: 'inline-type-imports',
      },
    ],
    'import/no-unresolved': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'none', // function arguments should not force to match this rule.
        ignoreRestSiblings: false,
        varsIgnorePattern: '[_]',
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-namespace': 'off',
    'import/order': [
      'error',
      {
        /** order { builtin：内置模块  external：外部模块  internal：内部引用  [ sibling：兄弟依赖,parent：父节点依赖 ]  index：index file } */
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'object', 'type', 'index'],
        'newlines-between': 'always',
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroups: [
          {
            pattern: 'react**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '{@/**,@**}',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '{**.less,**.json,**.svg,**.yaml,**.css}',
            group: 'index',
            position: 'after',
          },
        ],
      },
    ],
    'promise/prefer-await-to-then': 'warn',
    'react/jsx-key': [
      'error',
      {
        warnOnDuplicates: true,
      },
    ],
  },
};
