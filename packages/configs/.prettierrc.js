// Documentation for this file: https://prettier.io/docs/en/options.html
module.exports = {
  // We use a larger print width because Prettier's word-wrapping seems to be tuned
  // for plain JavaScript without type annotations
  printWidth: 110,
  // Use .gitattributes to manage newlines
  endOfLine: 'auto',
  // Use single quotes instead of double quotes
  singleQuote: true,
  // For ES5, trailing commas cannot be used in function parameters; it is counterintuitive
  // to use them for arrays only
  trailingComma: 'es5',
  semi: true,
  plugins: [
    require.resolve('prettier-plugin-packagejson'),
    require.resolve('prettier-plugin-tailwindcss'),
  ],
};
