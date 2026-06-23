import js from '@eslint/js';
import next from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/build/',
    '**/out/',
    '**/coverage/',
    '**/.next/',
    '**/.gen/',
    '**/*.gen.ts',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    'components/ui/*',
  ]),
  {
    extends: [next, nextCoreWebVitals, js.configs.recommended, typescriptEslint.configs.recommended],

    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
]);
