import assert from 'node:assert/strict';
import { lstat, readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const template = fileURLToPath(new URL('../', import.meta.url));

async function packagePath(base, value, field) {
  assert.equal(typeof value, 'string', `${field} must be a ./ relative path`);
  const segments = value.slice(2).split('/');
  assert.ok(
    value.startsWith('./') && !/[\\:\0?#%]/.test(value) &&
      segments.every((part) => part && part !== '.' && part !== '..'),
    `${field} must be a ./ relative path without traversal`,
  );
  let path = base;
  let stat;
  for (const part of segments) {
    path = join(path, part);
    stat = await lstat(path);
    assert.ok(!stat.isSymbolicLink(), `${field} must not use symlinks: ${path}`);
  }
  return { path, stat };
}

export async function checkClientPackage(directory = template) {
  const project = resolve(directory);
  const manifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
  const { client, host } = manifest.kem;
  const root = await packagePath(project, client.root, 'kem.client.root');
  assert.ok(root.stat.isDirectory(), 'kem.client.root must be a directory');
  assert.match(client.entry, /\.m?js$/, 'kem.client.entry must end in .js or .mjs');
  const entry = await packagePath(root.path, client.entry, 'kem.client.entry');
  assert.ok(entry.stat.isFile(), 'kem.client.entry must be a file under kem.client.root');

  const hostEntry = await packagePath(project, host, 'kem.host');
  assert.ok(hostEntry.stat.isFile(), 'kem.host must be a file');
  const fromRoot = relative(root.path, hostEntry.path);
  assert.ok(
    fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot),
    'kem.host must stay outside the client publish root',
  );
  return { manifest, root: root.path, entry: entry.path, hostEntry: hostEntry.path };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { entry } = await checkClientPackage();
  console.log(`KEM client entry: ${relative(template, entry).split(sep).join('/')}`);
}
