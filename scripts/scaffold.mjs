import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [directory, id, ...extra] = process.argv.slice(2);
if (!directory || extra.length) {
  throw new Error('Usage: pnpm scaffold <new-directory> [plugin-id]');
}
const target = resolve(directory);
const pluginId = id ?? basename(target);
if (!/^[a-z][a-z0-9-]{0,63}$/.test(pluginId)) {
  throw new Error('Plugin ID must start with a lowercase letter and contain only lowercase letters, digits and hyphens (max 64 characters).');
}

const template = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(join(template, 'package.json'), 'utf8'));

// Refuse to overwrite an existing directory. Copy source only, not the working tree.
await mkdir(target);
for (const path of [
  '.gitattributes', '.gitignore', 'AGENTS.md', 'README.md', 'host.mjs',
  'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'vite.config.ts',
  'scripts', 'src', 'tests',
]) {
  await cp(join(template, path), join(target, path), { recursive: true });
}
manifest.name = pluginId;
manifest.kem.id = pluginId;
await writeFile(join(target, 'package.json'), `${JSON.stringify(manifest, null, '\t')}\n`);
console.log(`Created ${pluginId} at ${target}`);
