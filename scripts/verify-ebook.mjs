// Run after pnpm build. Uses an isolated token store; never contacts Stripe.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root = process.cwd();
const chunks = path.join(root, 'dist/server/chunks');
const tokenFile = (await readdir(chunks)).find(f => f.startsWith('downloadTokens_'));
const tokens = await import(pathToFileURL(path.join(chunks, tokenFile)));
const { page } = await import(pathToFileURL(path.join(root, 'dist/server/pages/api/download/_token_.astro.mjs')));
const sandbox = await mkdtemp(path.join(tmpdir(), 'gdd-ebook-test-'));
try {
  process.chdir(sandbox);
  await mkdir('private/audiobooks', { recursive: true });
  const source = process.argv[2];
  assert(source, 'Pass the original PDF absolute path');
  await copyFile(source, 'private/audiobooks/instrumentalne-abc.pdf');
  const token = await tokens.b({ productId: 'instrumentalne-abc', email: 'test@example.invalid', sessionId: 'isolated-test' });
  const response = await page().GET({ params: { token } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  const hash = createHash('sha256');
  for await (const bytes of response.body) hash.update(bytes);
  assert.equal(hash.digest('hex'), createHash('sha256').update(await readFile(source)).digest('hex'));
  assert.equal((await page().GET({ params: { token } })).status, 410);
  assert.equal((await page().GET({ params: { token: 'invalid' } })).status, 410);
  const expired = await tokens.b({ productId: 'instrumentalne-abc', email: 'test@example.invalid', sessionId: 'expired-test' });
  const store = JSON.parse(await readFile('.data/download-tokens.json', 'utf8'));
  store.forEach(r => { r.expiresAt = 0; });
  await writeFile('.data/download-tokens.json', JSON.stringify(store));
  assert.equal((await page().GET({ params: { token: expired } })).status, 410);
  console.log('PASS: complete PDF SHA256, MIME, used/invalid/expired tokens');
} finally {
  process.chdir(root);
  await rm(sandbox, { recursive: true, force: true });
}
