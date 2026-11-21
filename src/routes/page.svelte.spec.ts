import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import CounterPage from './+page.svelte';

describe('计数器', () => {
	it('显示初始值，每次点击加一，重置后可重新计数', async () => {
		render(CounterPage);

		const count = page.getByRole('status', { name: '当前计数' });
		const increment = page.getByRole('button', { name: '加一' });
		const reset = page.getByRole('button', { name: '重置' });

		await expect.element(page.getByRole('heading', { name: '计数器', level: 1 })).toBeVisible();
		await expect.element(count).toHaveTextContent('0');

		await increment.click();
		await expect.element(count).toHaveTextContent('1');
		await increment.click();
		await expect.element(count).toHaveTextContent('2');

		await reset.click();
		await expect.element(count).toHaveTextContent('0');

		await increment.click();
		await expect.element(count).toHaveTextContent('1');
	});
});
