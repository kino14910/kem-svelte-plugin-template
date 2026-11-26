import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const project = dirname(dirname(fileURLToPath(import.meta.url)));

let code;
let runtime;

/** The same single Svelte runtime the KEM renderer hands to plugin bundles. */
async function loadPlatform() {
  const load = (path) => import(pathToFileURL(join(project, 'node_modules', path)).href);
  const [svelte, svelteInternalClient, svelteStore, svelteReactivity, discloseVersion] =
    await Promise.all([
      load('svelte/src/index-client.js'),
      load('svelte/src/internal/client/index.js'),
      load('svelte/src/store/index-client.js'),
      load('svelte/src/reactivity/index-client.js'),
      load('svelte/src/internal/disclose-version.js'),
    ]);
  return { svelte, svelteInternalClient, svelteStore, svelteReactivity, discloseVersion };
}

function evaluate(windowStub) {
  const bundle = new Function(
    'KEM_PLATFORM',
    'window',
    `${code}\nreturn __KEM_CLIENT_PLUGIN__?.default ?? __KEM_CLIENT_PLUGIN__;`,
  );
  return bundle(runtime, windowStub);
}

before(async () => {
  await run(
    process.execPath,
    [
      join(project, 'node_modules/vite/bin/vite.js'),
      'build',
      project,
      '--config',
      join(project, 'vite.config.ts'),
    ],
    { cwd: project },
  );
  code = await readFile(join(project, 'build/client.js'), 'utf8');
  runtime = await loadPlatform();
});

test('builds one client bundle that exports a Cordis plugin', async () => {
  assert.ok(!/^\s*(?:import|export)\s/m.test(code), 'client bundle must not keep ESM syntax');
  // Styles are compiled into the bundle instead of a sibling .css asset.
  assert.deepEqual(await readdir(join(project, 'build')), ['client.js']);
  const plugin = evaluate({ kemDesktop: { contributions: {} } });
  assert.deepEqual(plugin.inject, ['navRail', 'surfaces']);
  assert.equal(typeof plugin.apply, 'function');
});

test('registers nav, footer, service and desktop menu on one fiber', async () => {
  const events = [];
  let listener;
  let nav;
  let surface;
  let provided;
  const effects = [];
  const scope = 'scope-example';
  const windowStub = {
    kemDesktop: {
      contributions: {
        open: async () => scope,
        menu: async (key, items) => events.push(['menu', key, items.map(({ id }) => id)]),
        caption: async (key, text) => events.push(['caption', key, text]),
        close: async (key) => events.push(['close', key]),
        onAction: (next) => {
          listener = next;
          return () => events.push(['unsubscribe']);
        },
      },
    },
  };
  // Cordis executes an effect immediately and keeps its disposer for fiber unload.
  const ctx = {
    effect(setup) {
      effects.push(setup());
      return async () => {};
    },
    provide(name, value) {
      provided = { name, value };
      return async () => {};
    },
    navRail: {
      add(item) {
        nav = item;
        return async () => {};
      },
    },
    surfaces: {
      register(name, id, component) {
        surface = { name, id, component };
        return async () => {};
      },
    },
  };

  const plugin = evaluate(windowStub);
  await plugin.apply(ctx);

  assert.equal(nav.id, 'example-counter');
  assert.equal(nav.label, '计数器');
  assert.equal(typeof nav.view, 'function');
  assert.deepEqual(
    { name: surface.name, id: surface.id },
    { name: 'footer', id: 'example-counter' },
  );
  assert.equal(typeof surface.component, 'function');

  assert.equal(provided.name, 'exampleCounter');
  assert.equal(provided.value.apiVersion, 1);
  assert.equal(provided.value.get(), 0);
  let seen;
  const stop = provided.value.subscribe((value) => (seen = value));
  assert.equal(seen, 0);
  stop();

  assert.deepEqual(
    events.filter(([type]) => type === 'menu'),
    [['menu', scope, ['increment', 'reset']]],
  );

  // Tray actions mutate the same store the two contributions render.
  listener(scope, 'increment');
  assert.equal(provided.value.get(), 1);
  listener(scope, 'reset');
  assert.equal(provided.value.get(), 0);

  for (const cleanup of effects) await cleanup();
  assert.ok(events.some(([type, key]) => type === 'close' && key === scope));
});
