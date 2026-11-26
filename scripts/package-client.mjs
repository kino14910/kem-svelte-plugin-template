import { copyFile, lstat, mkdir, readdir } from 'node:fs/promises';

const source = new URL('../build/client.js', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
const { size } = await lstat(source);
if (size > 4 * 1024 * 1024) {
  throw new Error(`KEM client bundle exceeds the 4 MiB limit (${size} bytes).`);
}
await mkdir(dist, { recursive: true });
const entries = await readdir(dist, { withFileTypes: true });
if (entries.some((entry) => entry.name !== 'client.js' || !entry.isFile())) {
  throw new Error('Expected dist to contain only client.js. Check the extra files before rebuilding.');
}
await copyFile(source, new URL('client.js', dist));
console.log(`KEM client: dist/client.js (${size} bytes)`);
