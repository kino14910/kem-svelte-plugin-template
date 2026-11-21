import { copyFile, lstat, mkdir, readdir } from 'node:fs/promises';

const source = new URL('../build/index.html', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
const { size } = await lstat(source);
if (size > 2 * 1024 * 1024) {
	throw new Error(`KEM window exceeds the 2 MiB limit (${size} bytes).`);
}

await mkdir(dist, { recursive: true });
const entries = await readdir(dist, { withFileTypes: true });
if (entries.some((entry) => entry.name !== 'index.html' || !entry.isFile())) {
	throw new Error('Expected dist to contain only index.html. Check the extra files before rebuilding.');
}
await copyFile(source, new URL('index.html', dist));
console.log(`KEM window: dist/index.html (${size} bytes)`);
