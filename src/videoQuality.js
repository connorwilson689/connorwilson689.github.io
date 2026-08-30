export const VIDEO_QUALITY = {
  auto: 'auto',
  hd: 'hd',
  uhd: 'uhd'
};

export function shouldAutoUseUhd({
  fullscreen = false,
  screenWidth = 0,
  screenHeight = 0,
  devicePixelRatio = 1,
  saveData = false
} = {}) {
  if (!fullscreen || saveData) return false;

  return screenWidth * devicePixelRatio > 1920
    || screenHeight * devicePixelRatio > 1080;
}

export function resolveVideoSource(sources, quality = VIDEO_QUALITY.auto, preferUhd = false, failedSources = []) {
  const failed = new Set(failedSources);
  const preferredQuality = quality === VIDEO_QUALITY.auto
    ? (preferUhd ? VIDEO_QUALITY.uhd : VIDEO_QUALITY.hd)
    : quality;
  const fallbackQuality = preferredQuality === VIDEO_QUALITY.uhd
    ? VIDEO_QUALITY.hd
    : VIDEO_QUALITY.uhd;

  for (const candidate of [preferredQuality, fallbackQuality]) {
    const source = sources?.[candidate];
    if (source?.src && !failed.has(source.src)) {
      return { ...source, quality: candidate };
    }
  }

  return null;
}
