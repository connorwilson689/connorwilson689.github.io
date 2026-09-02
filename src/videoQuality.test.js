import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveVideoSource, shouldAutoUseUhd, VIDEO_QUALITY } from './videoQuality.js';

const sources = {
  hd: { src: 'footage-1080p.mp4', type: 'video/mp4' },
  uhd: { src: 'footage-2160p.mp4', type: 'video/mp4' },
  master: { src: 'footage.mp4', type: 'video/mp4', quality: VIDEO_QUALITY.uhd }
};

test('auto uses HD unless UHD is preferred', () => {
  assert.equal(resolveVideoSource(sources).quality, VIDEO_QUALITY.hd);
  assert.equal(resolveVideoSource(sources, VIDEO_QUALITY.auto, true).quality, VIDEO_QUALITY.uhd);
});

test('auto uses UHD only when fullscreen pixels benefit and data saver is off', () => {
  assert.equal(shouldAutoUseUhd({ fullscreen: false, screenWidth: 3840, screenHeight: 2160 }), false);
  assert.equal(shouldAutoUseUhd({ fullscreen: true, screenWidth: 1920, screenHeight: 1080 }), false);
  assert.equal(shouldAutoUseUhd({ fullscreen: true, screenWidth: 2560, screenHeight: 1440 }), true);
  assert.equal(shouldAutoUseUhd({ fullscreen: true, screenWidth: 1440, screenHeight: 900, devicePixelRatio: 2 }), true);
  assert.equal(shouldAutoUseUhd({ fullscreen: true, screenWidth: 3840, screenHeight: 2160, saveData: true }), false);
});

test('an explicit quality overrides the auto preference', () => {
  assert.equal(resolveVideoSource(sources, VIDEO_QUALITY.hd, true).quality, VIDEO_QUALITY.hd);
  assert.equal(resolveVideoSource(sources, VIDEO_QUALITY.uhd, false).quality, VIDEO_QUALITY.uhd);
});

test('a missing preferred rendition falls back to the available source', () => {
  assert.equal(resolveVideoSource({ uhd: sources.uhd }).quality, VIDEO_QUALITY.uhd);
  assert.equal(resolveVideoSource({ hd: sources.hd }, VIDEO_QUALITY.auto, true).quality, VIDEO_QUALITY.hd);
});

test('a failed rendition falls back and all failures return no source', () => {
  assert.equal(
    resolveVideoSource(sources, VIDEO_QUALITY.auto, false, [sources.hd.src]).quality,
    VIDEO_QUALITY.uhd
  );
  assert.equal(
    resolveVideoSource(sources, VIDEO_QUALITY.auto, false, [sources.hd.src, sources.uhd.src]).sourceKey,
    'master'
  );
  assert.equal(
    resolveVideoSource(sources, VIDEO_QUALITY.auto, false, [
      sources.hd.src,
      sources.uhd.src,
      sources.master.src
    ]),
    null
  );
});

test('an explicit 4K choice falls back to the untouched 4K master before HD', () => {
  const source = resolveVideoSource(sources, VIDEO_QUALITY.uhd, false, [sources.uhd.src]);

  assert.equal(source.sourceKey, 'master');
  assert.equal(source.quality, VIDEO_QUALITY.uhd);
});

test('a master-only asset remains playable at its declared quality', () => {
  const source = resolveVideoSource({ master: sources.master });

  assert.equal(source.src, sources.master.src);
  assert.equal(source.quality, VIDEO_QUALITY.uhd);
});
