import { expect, test } from '@playwright/test';

const windowPolicy = [
	"default-src 'none'",
	"script-src 'unsafe-inline'",
	"style-src 'unsafe-inline'",
	'img-src data: blob:',
	'font-src data: blob:',
	'media-src data: blob:',
	"base-uri 'none'",
	"form-action 'none'",
	'sandbox allow-scripts'
].join('; ');

test('打包的窗口在离线沙箱中可以加一和重置', async ({ page }) => {
	const windowUrl = 'https://kem-window.test/document/one-time-ticket';
	const requests: string[] = [];
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (msg) => {
		if (msg.type() === 'error') errors.push(msg.text());
	});
	await page.route('**/*', async (route) => {
		requests.push(route.request().url());
		if (route.request().url() !== windowUrl) return route.abort();
		return route.fulfill({
			contentType: 'text/html; charset=utf-8',
			headers: { 'Content-Security-Policy': windowPolicy },
			path: 'dist/index.html'
		});
	});
	await page.setContent(`<iframe sandbox="allow-scripts" src="${windowUrl}"></iframe>`);
	const frame = page.frameLocator('iframe');
	const reset = frame.getByRole('button', { name: '重置' });
	await expect(reset).toBeDisabled();
	await frame.getByRole('button', { name: '加一' }).click();
	await expect(frame.locator('output')).toHaveText('1');
	await reset.click();
	await expect(frame.locator('output')).toHaveText('0');
	expect(requests).toEqual([windowUrl]);
	expect(errors).toEqual([]);
});

test('SvelteKit 首页可以交互', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: '加一' }).click();
	await expect(page.locator('output')).toHaveText('1');
});
