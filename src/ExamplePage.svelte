<script lang="ts">
  import { count, increment, reset } from './example-store.ts';
  import type { RuntimeSnapshot } from './shared/protocol.ts';

  let { snapshot }: { snapshot: RuntimeSnapshot | null } = $props();
</script>

<section class="example">
  <header>
    <div>
      <p class="eyebrow">KEM CLIENT PLUGIN</p>
      <h1>示例计数器</h1>
    </div>
    <span class="host">Host r{snapshot?.revision ?? '—'}</span>
  </header>

  <p class="value" aria-live="polite">{$count}</p>

  <div class="actions">
    <button type="button" class="primary" onclick={increment}>加一</button>
    <button type="button" onclick={reset} disabled={$count === 0}>重置</button>
  </div>
</section>

<style>
  .example { display: grid; gap: 1.25rem; max-width: 32rem; }
  header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
  h1 { margin: 0; font-size: 1.8rem; }
  .eyebrow { margin: 0 0 .25rem; font: 600 .7rem/1.4 monospace; letter-spacing: .12em; color: var(--accent); }
  .host { color: var(--muted); font: .75rem/1.4 monospace; white-space: nowrap; }
  .value { margin: 0; padding: 1.5rem; border: 1px solid var(--line); border-radius: .8rem; font-size: 3rem; font-weight: 700; text-align: center; }
  .actions { display: flex; gap: .5rem; }
  button { border: 1px solid var(--line); border-radius: .5rem; padding: .5rem .9rem; background: transparent; color: inherit; cursor: pointer; }
  button.primary { border-color: var(--accent); }
  button:disabled { cursor: default; opacity: .5; }
</style>
