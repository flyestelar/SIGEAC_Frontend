import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:8000/docs/api.json',
  output: { path: '.gen/api', clean: false },
  plugins: ['@hey-api/client-axios', '@tanstack/react-query'],
});
