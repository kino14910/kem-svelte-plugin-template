import { get, writable } from 'svelte/store';

export const count = writable(0);

export function increment() {
  count.update((value) => value + 1);
}

export function reset() {
  count.set(0);
}

export function readCount() {
  return get(count);
}
