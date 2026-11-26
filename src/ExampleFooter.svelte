<script lang="ts">
  import { count, increment } from './example-store.ts';
  import type { RuntimeSnapshot } from './shared/protocol.ts';

  let { snapshot }: { snapshot: RuntimeSnapshot | null } = $props();
</script>

<div class="footer">
  <span class="label">计数 <b>{$count}</b></span>
  <span class="host">Host r{snapshot?.revision ?? '—'}</span>
  <button type="button" onclick={increment}>加一</button>
</div>

<style>
  .footer { display: flex; align-items: center; gap: .75rem; width: 100%; min-width: 0; }
  .label { font-size: .85rem; white-space: nowrap; }
  .host { flex: 1; min-width: 0; color: var(--muted); font: .75rem/1.4 monospace; text-align: center; }
  button { min-height: 1.8rem; border: 1px solid var(--line); border-radius: .4rem; padding: .25rem .7rem; background: transparent; color: inherit; cursor: pointer; }
</style>
