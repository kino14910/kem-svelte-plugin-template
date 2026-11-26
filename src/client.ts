import ExamplePage from './ExamplePage.svelte';
import ExampleFooter from './ExampleFooter.svelte';
import { useDesktop, type DesktopContext } from './sdk/desktop.ts';
import { count, increment, readCount, reset } from './example-store.ts';

interface ClientContext extends DesktopContext {
  provide(name: string, value: unknown): unknown;
  navRail: {
    add(item: { id: string; label: string; view: unknown }): () => Promise<void>;
  };
  surfaces: {
    register(
      name: 'footer' | 'sidebar',
      id: string,
      component: unknown,
    ): () => Promise<void>;
  };
}

export default {
  inject: ['navRail', 'surfaces'],
  async apply(ctx: ClientContext) {
    // Both contributions import the same module, so they share one live count.
    ctx.navRail.add({
      id: 'example-counter',
      label: '计数器',
      view: ExamplePage,
    });
    ctx.surfaces.register('footer', 'example-counter', ExampleFooter);

    // Other client plugins can inject `exampleCounter` and subscribe.
    ctx.provide('exampleCounter', {
      apiVersion: 1,
      get: readCount,
      subscribe: (listener: (value: number) => void) => count.subscribe(listener),
    });

    const desktop = await useDesktop(ctx, (id) => {
      if (id === 'increment') increment();
      if (id === 'reset') reset();
    });
    await desktop.menu([
      { id: 'increment', label: '加一' },
      { id: 'reset', label: '重置' },
    ]);
  },
};
