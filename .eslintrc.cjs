module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  rules: {},
}
