import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAMCORDER_MANIFEST_URL,
  loadCamcorderManifest,
  mergeCamcorderManifest
} from './camcorderManifest.js';

const manifestUrl = 'https://media.example.com/camcorder/manifest-v1.json';

function createFallback() {
  return {
    footage: {
      poster: '/images/footage.jpg',
      sources: {
        uhd: { src: 'https://fallback.example.com/footage.mp4', type: 'video/mp4' }
      }
    },
    cad: {
      poster: '/images/cad.jpg',
      sources: {
        uhd: { src: 'https://fallback.example.com/cad.mp4', type: 'video/mp4' }
      }
    },
    external: {
      sources: {
        hd: { src: 'https://fallback.example.com/external.mp4', type: 'video/mp4' }
      }
    }
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

test('merges valid matching sources and resolves paths against publicBaseUrl', () => {
  const fallback = deepFreeze(createFallback());
  const manifest = {
    version: 1,
    revision: 'build-42',
    generatedAt: '2026-08-31T12:00:00Z',
    publicBaseUrl: 'https://cdn.example.com/media/',
    assets: {
      footage: {
        sources: {
          hd: {
            src: 'camcorder/renditions/footage/1080p.mp4',
            type: 'video/mp4',
            width: 1920,
            height: 1080,
            bytes: 123,
            sha256: 'ignored'
          },
          uhd: { src: '/camcorder/footage.mp4', type: 'video/mp4' }
        }
      },
      external: { sources: {} }
    }
  };

  const result = mergeCamcorderManifest(fallback, manifest, manifestUrl);

  assert.notEqual(result, fallback);
  assert.deepEqual(result.footage.sources.hd, {
    src: 'https://cdn.example.com/media/camcorder/renditions/footage/1080p.mp4',
    type: 'video/mp4'
  });
  assert.equal(result.footage.sources.uhd.src, 'https://cdn.example.com/camcorder/footage.mp4');
  assert.equal(result.footage.poster, fallback.footage.poster);
  assert.equal(result.cad, fallback.cad);
  assert.equal(result.external, fallback.external);
  assert.equal(fallback.footage.sources.hd, undefined);
});

test('uses the manifest location when publicBaseUrl is absent', () => {
  const fallback = createFallback();
  const result = mergeCamcorderManifest(fallback, {
    version: 1,
    assets: {
      cad: { sources: { hd: { src: './cad-1080p.mp4', type: 'video/mp4' } } }
    }
  }, manifestUrl);

  assert.equal(result.cad.sources.hd.src, 'https://media.example.com/camcorder/cad-1080p.mp4');
});

test('ignores unknown assets, renditions, fields, and invalid source entries', () => {
  const fallback = createFallback();
  const result = mergeCamcorderManifest(fallback, {
    version: 1,
    assets: {
      footage: {
        poster: 'https://untrusted.example.com/poster.jpg',
        sources: {
          mobile: { src: 'mobile.mp4', type: 'video/mp4' },
          hd: { src: 'javascript:alert(1)', type: 'video/mp4' },
          uhd: { src: 'replacement.mp4', type: 'not a mime type' }
        }
      },
      unknown: { sources: { hd: { src: 'unknown.mp4', type: 'video/mp4' } } }
    }
  }, manifestUrl);

  assert.equal(result, fallback);
});

test('rejects unsupported or malformed manifests', () => {
  const fallback = createFallback();

  assert.equal(mergeCamcorderManifest(fallback, null, manifestUrl), fallback);
  assert.equal(mergeCamcorderManifest(fallback, { version: 2, assets: {} }, manifestUrl), fallback);
  assert.equal(mergeCamcorderManifest(fallback, { version: 1, assets: [] }, manifestUrl), fallback);
  assert.equal(
    mergeCamcorderManifest(fallback, { version: 1, publicBaseUrl: 'file:///tmp/', assets: {} }, manifestUrl),
    fallback
  );
});

test('loads and merges a valid remote manifest', async () => {
  const fallback = createFallback();
  let receivedSignal;
  const fetchImpl = async (url, options) => {
    assert.equal(url, manifestUrl);
    receivedSignal = options.signal;
    return {
      ok: true,
      json: async () => ({
        version: 1,
        assets: {
          footage: { sources: { hd: { src: 'footage-1080p.mp4', type: 'video/mp4' } } }
        }
      })
    };
  };

  const result = await loadCamcorderManifest({ manifestUrl, fallback, fetchImpl, timeoutMs: 100 });

  assert.equal(receivedSignal instanceof AbortSignal, true);
  assert.equal(result.footage.sources.hd.src, 'https://media.example.com/camcorder/footage-1080p.mp4');
});

test('uses the same-origin deployment manifest URL by default', async () => {
  const fallback = createFallback();
  let requestedUrl;

  await loadCamcorderManifest({
    fallback,
    fetchImpl: async (url) => {
      requestedUrl = url;
      return { ok: true, json: async () => ({ version: 1, assets: {} }) };
    }
  });

  assert.equal(requestedUrl, CAMCORDER_MANIFEST_URL);
});

test('returns the fallback for request, response, JSON, and schema failures', async () => {
  const fallback = createFallback();
  const cases = [
    async () => { throw new Error('offline'); },
    async () => ({ ok: false, json: async () => ({}) }),
    async () => ({ ok: true, json: async () => { throw new Error('invalid JSON'); } }),
    async () => ({ ok: true, json: async () => ({ version: 2, assets: {} }) })
  ];

  for (const fetchImpl of cases) {
    assert.equal(
      await loadCamcorderManifest({ manifestUrl, fallback, fetchImpl, timeoutMs: 100 }),
      fallback
    );
  }
});

test('aborts a slow request and returns the fallback after the timeout', async () => {
  const fallback = createFallback();
  let aborted = false;
  const fetchImpl = (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => {
      aborted = true;
      reject(new Error('aborted'));
    }, { once: true });
  });

  const result = await loadCamcorderManifest({ manifestUrl, fallback, fetchImpl, timeoutMs: 5 });

  assert.equal(result, fallback);
  assert.equal(aborted, true);
});

test('returns the fallback immediately for an aborted caller signal', async () => {
  const fallback = createFallback();
  const controller = new AbortController();
  controller.abort();
  let called = false;

  const result = await loadCamcorderManifest({
    manifestUrl,
    fallback,
    signal: controller.signal,
    fetchImpl: async () => {
      called = true;
      return { ok: true, json: async () => ({ version: 1, assets: {} }) };
    }
  });

  assert.equal(result, fallback);
  assert.equal(called, false);
});
