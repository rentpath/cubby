/**
 * @typedef {import('@typescript-eslint/experimental-utils/_ts3.4/dist/ts-eslint/Linter').Linter.Config} ESLintConfig
 */

/**
 * @type {ESLintConfig}
 */
const config = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: '.',
    project: './tsconfig.json',
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  ignorePatterns: ['**/*.mjs', '**/*.js'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:testing-library/react',
    'plugin:react-hooks/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/babel',
    'prettier/react',
    'prettier/standard',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  plugins: ['react', 'jsx-a11y', 'jest', '@typescript-eslint', 'testing-library', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        paths: ['packages', 'test'],
        extensions: ['.js', '.mjs', '.ts', '.tsx', '.d.ts', '.graphql'],
      },
    },
  },
  rules: {
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-redeclare': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],
    'react/prop-types': 'off',
    'react/jsx-props-no-spreading': [
      'error',
      {
        html: 'enforce',
        custom: 'enforce',
        explicitSpread: 'enforce',
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.test.*', '**/*.stories.*', '**/*.story.*'],
      parser: '@typescript-eslint/parser',
      rules: {
        'react/jsx-props-no-spreading': 'off',
        '@typescript-eslint/unbound-method': 'off',
      },
    },
  ],
}

module.exports = config
