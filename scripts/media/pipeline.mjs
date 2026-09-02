import { createHash } from 'node:crypto';
import {
  closeSync,
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_CATALOG = 'media/camcorder.pipeline.json';
const MANIFEST_NAME = 'manifest-v1.json';
const MIME_TYPE = 'video/mp4';
const SOURCE_ORIGIN = 'https://pub-27f889cb448f4fa49aa8594609bc3cf2.r2.dev/';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => (
    `${JSON.stringify(key)}:${stableStringify(value[key])}`
  )).join(',')}}`;
}

function hashText(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function hashFile(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function validateCatalog(catalog) {
  if (!isRecord(catalog) || catalog.version !== 1 || !isRecord(catalog.assets) || !isRecord(catalog.encoding)) {
    throw new Error('The media catalog must use schema version 1');
  }

  const assetIds = Object.keys(catalog.assets);
  if (assetIds.length === 0) throw new Error('The media catalog has no assets');

  for (const [assetId, asset] of Object.entries(catalog.assets)) {
    if (!/^[a-z0-9-]+$/.test(assetId) || !isRecord(asset)) {
      throw new Error(`Invalid asset definition: ${assetId}`);
    }
    if (typeof asset.sourceKey !== 'string' || !asset.sourceKey.startsWith('camcorder/') || asset.sourceKey.includes('..')) {
      throw new Error(`Invalid source key for ${assetId}`);
    }
    const expectedSourceUrl = new URL(asset.sourceKey, SOURCE_ORIGIN).href;
    if (asset.sourceUrl !== expectedSourceUrl) {
      throw new Error(`Invalid source URL for ${assetId}`);
    }
    if (!isRecord(asset.renditions)) throw new Error(`Missing renditions for ${assetId}`);

    for (const [quality, rendition] of Object.entries(asset.renditions)) {
      if (!['hd', 'uhd'].includes(quality) || !isRecord(rendition)) {
        throw new Error(`Invalid rendition ${assetId}.${quality}`);
      }
      for (const field of ['width', 'height', 'crf']) {
        if (!Number.isInteger(rendition[field]) || rendition[field] <= 0) {
          throw new Error(`Invalid ${field} for ${assetId}.${quality}`);
        }
      }
      for (const field of ['maxRate', 'bufferSize', 'level']) {
        if (typeof rendition[field] !== 'string' || rendition[field] === '') {
          throw new Error(`Invalid ${field} for ${assetId}.${quality}`);
        }
      }
    }
  }

  for (const field of ['maxOutputBytes', 'maxPublishedBytes']) {
    if (!Number.isInteger(catalog.encoding[field]) || catalog.encoding[field] <= 0) {
      throw new Error(`encoding.${field} must be a positive integer`);
    }
  }
  return catalog;
}

export function readCatalog(filePath = DEFAULT_CATALOG) {
  return validateCatalog(readJson(resolve(filePath)));
}

function parseArgs(values) {
  const options = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) throw new Error(`Unexpected argument: ${value}`);
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith('--')) options[key] = true;
    else {
      options[key] = next;
      index += 1;
    }
  }
  return options;
}

function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const details = capture ? `\n${result.stderr || result.stdout}` : '';
    throw new Error(`${command} exited with status ${result.status}${details}`);
  }
  return result.stdout?.trim() || '';
}

async function getSourceIdentity(sourceUrl, fetchImpl = globalThis.fetch) {
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetchImpl(sourceUrl, { method: 'HEAD', redirect: 'follow' });
      if (response.ok) break;
    } catch {
      response = null;
    }
    if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1000));
  }
  if (!response?.ok) throw new Error(`Unable to inspect source video: ${sourceUrl}`);

  const etag = response.headers.get('etag') || '';
  const lastModified = response.headers.get('last-modified') || '';
  const bytes = response.headers.get('content-length') || '';
  if (!etag && !lastModified && !bytes) throw new Error(`Source video returned no cache identity: ${sourceUrl}`);
  return { sourceUrl, etag, lastModified, bytes };
}

export async function createSourceFingerprint(catalog, fetchImpl = globalThis.fetch) {
  validateCatalog(catalog);
  const sources = await Promise.all(Object.values(catalog.assets).map((asset) => (
    getSourceIdentity(asset.sourceUrl, fetchImpl)
  )));
  const pipelineHash = hashText(readFileSync(fileURLToPath(import.meta.url), 'utf8'));
  return hashText(stableStringify({ catalog, pipelineHash, sources }));
}

function getFfmpegVersion() {
  return run('ffmpeg', ['-version'], { capture: true }).split(/\r?\n/, 1)[0];
}

function probeVideo(filePath) {
  return JSON.parse(run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height,pix_fmt',
    '-show_entries', 'format=duration,size',
    '-of', 'json',
    filePath
  ], { capture: true }));
}

function hasFastStart(filePath) {
  const scan = Buffer.alloc(Math.min(statSync(filePath).size, 8 * 1024 * 1024));
  const descriptor = openSync(filePath, 'r');
  try {
    readSync(descriptor, scan, 0, scan.length, 0);
  } finally {
    closeSync(descriptor);
  }
  const moov = scan.indexOf(Buffer.from('moov'));
  const mdat = scan.indexOf(Buffer.from('mdat'));
  return moov >= 0 && (mdat < 0 || moov < mdat);
}

function validateRendition(filePath, rendition, sourceDuration, maxOutputBytes) {
  const bytes = statSync(filePath).size;
  if (bytes <= 0 || bytes > maxOutputBytes) {
    throw new Error(`${basename(filePath)} is outside the allowed size range`);
  }
  if (!hasFastStart(filePath)) throw new Error(`${basename(filePath)} is not a fast-start MP4`);

  const probe = probeVideo(filePath);
  const video = probe.streams?.[0];
  const duration = Number.parseFloat(probe.format?.duration);
  if (video?.codec_name !== 'h264' || video.pix_fmt !== 'yuv420p') {
    throw new Error(`${basename(filePath)} is not H.264 yuv420p`);
  }
  if (video.width !== rendition.width || video.height !== rendition.height) {
    throw new Error(`${basename(filePath)} has unexpected dimensions`);
  }
  if (!Number.isFinite(duration) || Math.abs(duration - sourceDuration) > 0.75) {
    throw new Error(`${basename(filePath)} has an unexpected duration`);
  }
  run('ffmpeg', ['-v', 'error', '-i', filePath, '-f', 'null', '-']);
  return { bytes, duration };
}

function encodeRendition(sourcePath, outputPath, rendition, encoding) {
  const filter = [
    `scale=${rendition.width}:${rendition.height}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
    `pad=${rendition.width}:${rendition.height}:(ow-iw)/2:(oh-ih)/2`
  ].join(',');
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-i', sourcePath,
    '-map', '0:v:0', '-map', '0:a:0?',
    '-vf', filter,
    '-c:v', encoding.videoCodec,
    '-preset', encoding.preset,
    '-profile:v', 'high',
    '-level:v', rendition.level,
    '-crf', String(rendition.crf),
    '-maxrate', rendition.maxRate,
    '-bufsize', rendition.bufferSize,
    '-pix_fmt', encoding.pixelFormat,
    '-tag:v', 'avc1',
    '-force_key_frames', `expr:gte(t,n_forced*${encoding.keyframeSeconds})`,
    '-c:a', encoding.audioCodec,
    '-b:a', encoding.audioBitrate,
    '-movflags', '+faststart',
    outputPath
  ]);
}

async function cacheIsComplete(cacheDir, catalog, fingerprint) {
  const manifestPath = join(cacheDir, MANIFEST_NAME);
  if (!existsSync(manifestPath)) return false;
  try {
    const manifest = readJson(manifestPath);
    if (manifest.version !== 1 || manifest.revision !== fingerprint) return false;
    for (const [assetId, asset] of Object.entries(catalog.assets)) {
      for (const quality of Object.keys(asset.renditions)) {
        const source = manifest.assets?.[assetId]?.sources?.[quality];
        if (
          typeof source?.src !== 'string'
          || !source.src.startsWith(`renditions/${assetId}/`)
          || source.src.includes('..')
        ) return false;

        const cachePath = join(cacheDir, source.src);
        if (!existsSync(cachePath) || statSync(cachePath).size !== source.bytes) return false;
        if (await hashFile(cachePath) !== source.sha256) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function copyCacheToOutput(cacheDir, outputDir, manifest) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  for (const [assetId, asset] of Object.entries(manifest.assets)) {
    for (const [quality, source] of Object.entries(asset.sources)) {
      if (!source.src.startsWith(`renditions/${assetId}/`) || source.src.includes('..')) {
        throw new Error(`Unsafe cached path for ${assetId}.${quality}`);
      }
      const destination = join(outputDir, source.src);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(cacheDir, source.src), destination);
      if (!existsSync(destination)) throw new Error(`Failed to publish ${assetId}.${quality}`);
    }
  }
  copyFileSync(join(cacheDir, MANIFEST_NAME), join(outputDir, MANIFEST_NAME));
}

async function buildPagesMedia(options) {
  const catalog = readCatalog(options.catalog || DEFAULT_CATALOG);
  const cacheDir = resolve(options.cache || '.media-cache');
  const outputDir = resolve(options.output || 'dist/videos/camcorder');
  const fingerprint = options.fingerprint || await createSourceFingerprint(catalog);

  if (await cacheIsComplete(cacheDir, catalog, fingerprint)) {
    const manifest = readJson(join(cacheDir, MANIFEST_NAME));
    copyCacheToOutput(cacheDir, outputDir, manifest);
    process.stderr.write('Camcorder renditions restored from the Actions cache\n');
    return;
  }

  rmSync(cacheDir, { recursive: true, force: true });
  mkdirSync(cacheDir, { recursive: true });
  const workDir = resolve(options.work || '.media-work');
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });
  const assets = {};
  let publishedBytes = 0;

  for (const [assetId, asset] of Object.entries(catalog.assets)) {
    const sourcePath = join(workDir, `${assetId}-source.mp4`);
    run('curl', [
      '--fail', '--location', '--retry', '5', '--retry-all-errors',
      '--connect-timeout', '30', '--continue-at', '-', '--output', sourcePath, asset.sourceUrl
    ]);
    const sourceSha256 = await hashFile(sourcePath);
    const sourceProbe = probeVideo(sourcePath);
    const sourceDuration = Number.parseFloat(sourceProbe.format?.duration);
    if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) {
      throw new Error(`${assetId}: source duration is invalid`);
    }

    const sources = {};
    for (const [quality, rendition] of Object.entries(asset.renditions)) {
      const relativePath = `renditions/${assetId}/${fingerprint.slice(0, 16)}/${quality}.mp4`;
      const cachePath = join(cacheDir, relativePath);
      mkdirSync(dirname(cachePath), { recursive: true });
      encodeRendition(sourcePath, cachePath, rendition, catalog.encoding);
      const validation = validateRendition(
        cachePath,
        rendition,
        sourceDuration,
        catalog.encoding.maxOutputBytes
      );
      publishedBytes += validation.bytes;
      if (publishedBytes > catalog.encoding.maxPublishedBytes) {
        throw new Error('Generated video exceeds the GitHub Pages publication budget');
      }
      sources[quality] = {
        src: relativePath,
        type: MIME_TYPE,
        width: rendition.width,
        height: rendition.height,
        bytes: validation.bytes,
        sha256: await hashFile(cachePath)
      };
    }
    assets[assetId] = {
      source: { url: asset.sourceUrl, sha256: sourceSha256 },
      sources
    };
  }

  const manifest = {
    version: 1,
    revision: fingerprint,
    generatedAt: new Date().toISOString(),
    ffmpegVersion: getFfmpegVersion(),
    assets
  };
  writeJson(join(cacheDir, MANIFEST_NAME), manifest);
  copyCacheToOutput(cacheDir, outputDir, manifest);
  rmSync(workDir, { recursive: true, force: true });
  process.stderr.write(`Published ${Math.round(publishedBytes / 1048576)} MiB of generated video\n`);
}

async function main() {
  const [command, ...rawArgs] = process.argv.slice(2);
  const options = parseArgs(rawArgs);
  if (command === 'fingerprint') {
    process.stdout.write(await createSourceFingerprint(readCatalog(options.catalog || DEFAULT_CATALOG)));
    return;
  }
  if (command === 'build-pages') {
    await buildPagesMedia(options);
    return;
  }
  throw new Error(`Unknown pipeline command: ${command || '(missing)'}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
