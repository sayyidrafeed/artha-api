import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
  splitting: false,
  treeshake: true,
  minify: false,
  // Bundle all dependencies for serverless deployment
  noExternal: [/.*/],
  // Ensure proper ESM output
  platform: 'node',
  // Banner for ESM compatibility with packages using require()
  banner: {
    js: `import { createRequire } from 'module';
const require = createRequire(import.meta.url);`,
  },
});
