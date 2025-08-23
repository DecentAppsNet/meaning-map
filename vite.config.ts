import { defineConfig } from 'vite'
import path from 'path';
import { fileURLToPath } from 'url';
import { coverageConfigDefaults } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
      alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/persistence/**',
        '**/interactions/**',
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'decent-portal',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: { dir: 'dist' }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        pure_funcs: ['assert', 'assertNonNullable', 'assertTruthy', 'botch']
      }
    },
    sourcemap: true,
  }
});