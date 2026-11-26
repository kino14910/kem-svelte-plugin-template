import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true, css: 'injected' } })],
  build: {
    outDir: 'build',
    emptyOutDir: true,
    lib: {
      entry: 'src/client.ts',
      formats: ['iife'],
      name: '__KEM_CLIENT_PLUGIN__',
      fileName: () => 'client.js',
    },
    rollupOptions: {
      external: [
        'svelte',
        'svelte/internal/client',
        'svelte/internal/disclose-version',
        'svelte/store',
        'svelte/reactivity',
      ],
      output: {
        globals: {
          svelte: 'KEM_PLATFORM.svelte',
          'svelte/internal/client': 'KEM_PLATFORM.svelteInternalClient',
          'svelte/internal/disclose-version':
            'KEM_PLATFORM.discloseVersion',
          'svelte/store': 'KEM_PLATFORM.svelteStore',
          'svelte/reactivity': 'KEM_PLATFORM.svelteReactivity',
        },
      },
    },
    cssCodeSplit: false,
    assetsInlineLimit: () => true,
  },
});
