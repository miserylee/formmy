import { HtmlRspackPlugin, RspackOptions } from '@rspack/core';

const config: RspackOptions = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
            },
            transform: {
              react: {
                runtime: 'automatic',
              },
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [new HtmlRspackPlugin()],
};

export default config;
