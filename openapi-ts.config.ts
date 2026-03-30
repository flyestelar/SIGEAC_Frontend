import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://172.190.0.166:81/docs/api.json',
  output: { path: '.gen/api', postProcess: ['prettier'] },
  plugins: ['@hey-api/client-axios', '@tanstack/react-query'],
});
