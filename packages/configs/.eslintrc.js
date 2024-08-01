// This is a workaround for https://github.com/eslint/eslint/issues/3458
require('@rushstack/eslint-patch/modern-module-resolution');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  extends: [path.resolve(__dirname, './.eslintrc.base.js')],
};
