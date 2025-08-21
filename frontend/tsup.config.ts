import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'InnovaTracker',
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: false, // <-- La clave para resolver el problema
});

