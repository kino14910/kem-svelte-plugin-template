import type { ContributionBridge, TrayAction } from '../shared/contributions.ts';

/** The subset of the Cordis context that desktop contributions rely on. */
export interface DesktopContext {
  effect(setup: () => (() => void) | Promise<() => void>): unknown;
}

interface DesktopWindow extends Window {
  kemDesktop: { contributions: ContributionBridge };
}

/** Bind native resources and action callbacks to this activation, not to a page mount. */
export async function useDesktop(
  ctx: DesktopContext,
  onAction: (id: string) => void,
) {
  const bridge = (window as unknown as DesktopWindow).kemDesktop.contributions;
  const opening = bridge.open();
  let active = true;
  let unsubscribe: (() => void) | undefined;
  ctx.effect(() => async () => {
    active = false;
    unsubscribe?.();
    // A rejected open has no native resources to release.
    await opening.then(
      (key) => bridge.close(key),
      () => {},
    );
  });
  const key = await opening;
  if (!active) throw new Error('Plugin was unloaded');
  unsubscribe = bridge.onAction((scope, id) => {
    if (active && scope === key) onAction(id);
  });
  return {
    menu: (items: TrayAction[]) => bridge.menu(key, items),
    caption: (text: string | null) => bridge.caption(key, text),
  };
}
