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
      name: 'meaning-map',
      // produce ES and CommonJS builds for Node consumers
      formats: ['es', 'cjs']
    },
    // target Node so built-in modules (fs, path) are resolved from Node, not
    // externalized for browser compatibility
    target: 'node22',
    rollupOptions: {
      // keep Node built-ins external when bundling for Node
      external: ['fs', 'fs/promises', 'path', 'crypto'],
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