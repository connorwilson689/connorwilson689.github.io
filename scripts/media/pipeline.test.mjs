import assert from 'node:assert/strict';
import test from 'node:test';
import { createSourceFingerprint, readCatalog, validateCatalog } from './pipeline.mjs';

test('the checked-in Pages media catalog is valid and keeps both resolutions', () => {
  const catalog = readCatalog();

  assert.deepEqual(Object.keys(catalog.assets), ['footage', 'cad']);
  assert.deepEqual(Object.keys(catalog.assets.footage.renditions), ['hd', 'uhd']);
  assert.equal(catalog.assets.footage.renditions.uhd.height, 2160);
  assert.ok(catalog.encoding.maxPublishedBytes < 1024 ** 3);
});

test('catalog validation rejects unsafe source keys, URLs, and publication limits', () => {
  const unsafeKey = structuredClone(readCatalog());
  unsafeKey.assets.footage.sourceKey = '../footage.mp4';
  assert.throws(() => validateCatalog(unsafeKey), /Invalid source key/);

  const unsafeUrl = structuredClone(readCatalog());
  unsafeUrl.assets.footage.sourceUrl = 'http://media.example.com/footage.mp4';
  assert.throws(() => validateCatalog(unsafeUrl), /Invalid source URL/);

  const invalidLimit = structuredClone(readCatalog());
  invalidLimit.encoding.maxPublishedBytes = 0;
  assert.throws(() => validateCatalog(invalidLimit), /maxPublishedBytes/);
});

test('source fingerprints are stable and change when a master changes', async () => {
  const catalog = readCatalog();
  const fetchWithEtag = (etag) => async () => ({
    ok: true,
    headers: new Headers({ etag, 'content-length': '1234' })
  });

  const first = await createSourceFingerprint(catalog, fetchWithEtag('source-v1'));
  const repeated = await createSourceFingerprint(catalog, fetchWithEtag('source-v1'));
  const changed = await createSourceFingerprint(catalog, fetchWithEtag('source-v2'));

  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(repeated, first);
  assert.notEqual(changed, first);
});

test('fingerprinting fails closed when a source has no usable identity', async () => {
  const catalog = readCatalog();
  const noIdentity = async () => ({ ok: true, headers: new Headers() });

  await assert.rejects(createSourceFingerprint(catalog, noIdentity), /no cache identity/);
});
