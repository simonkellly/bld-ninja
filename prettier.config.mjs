/** @type {import('prettier').Config} */
export default {
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  arrowParens: 'avoid',
  trailingComma: 'es5',
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^@/components/(.*)$',
    '^@/lib/(.*)$',
    '^@/([^/]+)',
    '^[./]',
  ],
};
