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
    },
  },
  ignorePatterns: ['**/lib/'],
  rules: {
    'prettier/prettier': ['warn', require('./.prettierrc.js'), { usePrettierrc: false }],
  },
};
