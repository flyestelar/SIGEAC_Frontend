import { defineConfig, globalIgnores } from 'eslint/config';
import next from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import typescriptEslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

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
    "components/ui/*"
    
  ]),
  {
    extends: [next, nextCoreWebVitals, typescriptEslint.configs.recommended],

    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
]);
