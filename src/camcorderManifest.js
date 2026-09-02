const DEFAULT_TIMEOUT_MS = 2500;
const SUPPORTED_RENDITIONS = new Set(['hd', 'uhd']);
const MIME_TYPE_PATTERN = /^[\w!#$&^_.+-]+\/[\w!#$&^_.+-]+(?:\s*;.*)?$/;

export const CAMCORDER_MANIFEST_URL =
  '/videos/camcorder/manifest-v1.json';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function resolveHttpUrl(value, baseUrl = globalThis.location?.href || 'http://localhost/') {
  if (typeof value !== 'string' || value.trim() === '') return null;

  try {
    const url = new URL(value, baseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeSource(source, baseUrl) {
  if (!isRecord(source) || typeof source.type !== 'string') return null;

  const type = source.type.trim();
  const src = resolveHttpUrl(source.src, baseUrl);
  if (!src || !MIME_TYPE_PATTERN.test(type)) return null;

  return { src, type };
}

/**
 * Validates and merges a remote manifest over checked-in media definitions.
 * Unknown assets, renditions, fields, and invalid sources are ignored.
 */
export function mergeCamcorderManifest(fallback, manifest, manifestUrl) {
  if (!isRecord(fallback) || !isRecord(manifest) || manifest.version !== 1 || !isRecord(manifest.assets)) {
    return fallback;
  }

  const absoluteManifestUrl = resolveHttpUrl(manifestUrl);
  if (!absoluteManifestUrl) return fallback;

  const sourceBaseUrl = manifest.publicBaseUrl === undefined
    ? absoluteManifestUrl
    : resolveHttpUrl(manifest.publicBaseUrl, absoluteManifestUrl);
  if (!sourceBaseUrl) return fallback;

  let merged = fallback;

  for (const [assetId, asset] of Object.entries(manifest.assets)) {
    if (!Object.prototype.hasOwnProperty.call(fallback, assetId) || !isRecord(asset) || !isRecord(asset.sources)) {
      continue;
    }

    const fallbackAsset = isRecord(fallback[assetId]) ? fallback[assetId] : {};
    const fallbackSources = isRecord(fallbackAsset.sources) ? fallbackAsset.sources : {};
    let mergedSources = fallbackSources;

    for (const [rendition, source] of Object.entries(asset.sources)) {
      if (!SUPPORTED_RENDITIONS.has(rendition)) continue;

      const normalizedSource = normalizeSource(source, sourceBaseUrl);
      if (!normalizedSource) continue;

      if (mergedSources === fallbackSources) mergedSources = { ...fallbackSources };
      mergedSources[rendition] = {
        ...(isRecord(fallbackSources[rendition]) ? fallbackSources[rendition] : {}),
        ...normalizedSource
      };
    }

    if (mergedSources === fallbackSources) continue;
    if (merged === fallback) merged = { ...fallback };
    merged[assetId] = { ...fallbackAsset, sources: mergedSources };
  }

  return merged;
}

/**
 * Fetches a remote manifest for use from a React effect or other runtime code.
 * Every failure mode resolves to the supplied fallback instead of rejecting.
 */
export async function loadCamcorderManifest({
  manifestUrl = CAMCORDER_MANIFEST_URL,
  fallback,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
  signal
} = {}) {
  if (!isRecord(fallback) || typeof fetchImpl !== 'function' || !resolveHttpUrl(manifestUrl)) {
    return fallback;
  }

  if (signal?.aborted) return fallback;

  const controller = new AbortController();
  const duration = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;
  const abortFromCaller = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Camcorder manifest request timed out'));
    }, duration);
  });

  try {
    const response = await Promise.race([
      fetchImpl(manifestUrl, { signal: controller.signal }),
      timeout
    ]);
    if (!response?.ok || typeof response.json !== 'function') return fallback;

    const manifest = await Promise.race([response.json(), timeout]);
    return mergeCamcorderManifest(fallback, manifest, manifestUrl);
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
