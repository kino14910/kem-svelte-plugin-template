import type { TrayAction } from './shared/contributions.ts';

export const trayMenu: TrayAction[] = [
  { id: 'increment', label: '加一' },
  { id: 'reset', label: '重置' },
];
