import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { checkClientPackage } from '../scripts/check-client.mjs';

const { manifest, root, entry, hostEntry } = await checkClientPackage(process.env.KEM_PACKAGE_DIR);
const supportedExternals = new Set([
  'svelte', 'svelte/internal/client', 'svelte/internal/disclose-version',
  'svelte/store', 'svelte/reactivity',
]);

test('publishes a native ESM entry and a relative tray-menu chunk under the client root', async () => {
  assert.equal(manifest.type, 'module');
  assert.equal(manifest.kem.client.root, './dist');
  assert.equal(manifest.kem.client.entry, './client.js');
  assert.equal(manifest.kem.host, './host.mjs');

  const visited = new Set();
  const bareImports = new Set();
  async function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const code = await readFile(file, 'utf8');
    assert.doesNotMatch(code, /\b(?:KEM_PLATFORM|__KEM_CLIENT_PLUGIN__)\b/);
    for (const { fileName: specifier } of ts.preProcessFile(code, true, true).importedFiles) {
      if (specifier.startsWith('./') || specifier.startsWith('../')) {
        const importedFile = resolve(dirname(file), specifier);
        const fromRoot = relative(root, importedFile);
        assert.ok(fromRoot && !isAbsolute(fromRoot) && !/^\.\.(?:[\\/]|$)/.test(fromRoot), specifier);
        await visit(importedFile);
      } else {
        assert.ok(supportedExternals.has(specifier), `Unexpected bare import: ${specifier}`);
        bareImports.add(specifier);
      }
    }
  }
  await visit(entry);
  assert.ok([...visited].some((file) => /^chunks[\\/]tray-menu-.+\.js$/.test(relative(root, file))));
  // The other supported externals are available to authors but not used by this example.
  for (const specifier of ['svelte/internal/client', 'svelte/internal/disclose-version', 'svelte/store']) {
    assert.ok(bareImports.has(specifier), `Expected shared runtime import: ${specifier}`);
  }
  const host = await import(pathToFileURL(hostEntry).href);
  assert.equal(typeof host.default, 'function');
});

test('imports the default Cordis plugin, shares state, and resets on reactivation', async () => {
  const { default: plugin } = await import(pathToFileURL(entry).href);
  assert.deepEqual(plugin.inject, ['navRail', 'surfaces']);
  assert.equal(typeof plugin.apply, 'function');

  const events = [];
  let listener;
  let nav;
  let surface;
  let provided;
  const effects = [];
  const scope = 'scope-example';
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      kemDesktop: {
        contributions: {
          open: async () => scope,
          menu: async (key, items) => events.push(['menu', key, items.map(({ id }) => id)]),
          close: async (key) => events.push(['close', key]),
          onAction: (next) => {
            listener = next;
            return () => events.push(['unsubscribe']);
          },
        },
      },
    },
  });

  // Cordis runs the setup on activation and retains the disposer for Fiber unload.
  const ctx = {
    effect(setup) { effects.push(setup()); },
    provide(name, value) { provided = { name, value }; },
    navRail: { add(item) { nav = item; } },
    surfaces: { register(name, id, component) { surface = { name, id, component }; } },
  };
  async function unload() {
    for (const cleanup of effects.splice(0).reverse()) await cleanup();
  }

  try {
    await plugin.apply(ctx);
    assert.equal(nav.id, manifest.kem.id);
    assert.equal(nav.label, manifest.kem.client.label);
    assert.equal(typeof nav.view, 'function');
    assert.equal(surface.name, 'footer');
    assert.equal(surface.id, manifest.kem.id);
    assert.equal(typeof surface.component, 'function');
    assert.equal(provided.name, 'exampleCounter');
    assert.equal(provided.value.apiVersion, 1);
    assert.deepEqual(events, [['menu', scope, ['increment', 'reset']]]);

    const counts = [];
    const stop = provided.value.subscribe((value) => counts.push(value));
    listener('unrelated-scope', 'increment');
    listener(scope, 'increment');
    listener(scope, 'reset');
    listener(scope, 'increment');
    stop();
    assert.deepEqual(counts, [0, 1, 0, 1]);
    assert.equal(provided.value.get(), 1);

    await unload();
    assert.deepEqual(events.slice(-2), [['unsubscribe'], ['close', scope]]);
    listener(scope, 'increment');
    assert.equal(provided.value.get(), 1);

    // Reuse the same module instance, as a native ESM loader may do.
    await plugin.apply(ctx);
    assert.equal(provided.value.get(), 0);
  } finally {
    await unload();
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else delete globalThis.window;
  }
});
