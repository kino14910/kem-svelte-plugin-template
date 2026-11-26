import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [svelte({ compilerOptions: { runes: true, css: 'injected' } })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/client.ts',
      formats: ['es'],
      fileName: () => 'client.js',
    },
    rolldownOptions: {
      external: [
        'svelte',
        'svelte/internal/client',
        'svelte/internal/disclose-version',
        'svelte/store',
        'svelte/reactivity',
      ],
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        codeSplitting: {
          // Keep one real relative import in the example even without lazy loading.
          groups: [{ name: 'tray-menu', test: /[/\\]tray-menu\.ts$/ }],
        },
      },
    },
  },
});
