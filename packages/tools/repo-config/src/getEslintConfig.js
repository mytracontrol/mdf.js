/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

const config = {
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    project: ['./tsconfig.lint.json'],
  },
  ignorePatterns: ['**/node_modules/*', '**/dist/*', '**/coverage/*', '**/*.js'],
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  plugins: ['eslint-plugin-tsdoc'],
  extends: [
    // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended',
    // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'prettier',
    // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    'tsdoc/syntax': 'warn',
    'max-len': ['error', { code: 100, comments: 100, tabWidth: 2, ignoreTemplateLiterals: true }],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        minimumDescriptionLength: 10,
      },
    ],
  },
  overrides: [
    {
      files: ['src/**/*.test.ts'],
      rules: {
        '@typescript-eslint/ban-ts-comment': [
          'error',
          {
            'ts-ignore': false,
            'ts-nocheck': false,
          },
        ],
        'max-len': [
          'error',
          {
            code: 100,
            comments: 100,
            tabWidth: 2,
            ignoreTemplateLiterals: true,
            ignoreStrings: true,
          },
        ],
      },
    },
  ],
};
/**
 * Return the standard eslint config for a given library
 */
function getEslintConfig() {
  return {
    ...config,
  };
}
module.exports = getEslintConfig;
