# Camcorder video pipeline

The 4K masters remain untouched in the existing public Cloudflare R2 bucket:

- `camcorder/footage.mp4`
- `camcorder/cad-video.mp4`
- `camcorder/external-footage.mp4` (existing 1080p clip)

No local conversion, generated-file upload, account, token, repository secret, or
manual workflow run is required. The existing **Deploy website** workflow does
the media work before it publishes GitHub Pages.

On a deployment, the workflow:

1. checks the R2 masters' HTTP metadata and derives a cache key
2. restores previously generated renditions when the masters are unchanged
3. otherwise downloads the masters and creates fast-start H.264/AAC 1080p and
   4K renditions with FFmpeg
4. validates codec, dimensions, duration, decoding, file size, and fast-start
   metadata
5. publishes the renditions and `manifest-v1.json` with the Pages artifact

The player reads the same-origin manifest automatically. Auto uses 1080p in the
inline grid and permits 4K in fullscreen on displays that benefit from it. The
quality menu still allows an explicit override. If the manifest or a rendition
is unavailable, playback falls back to the untouched R2 master.

The generated media is kept out of Git and stored in the repository's included
GitHub Actions cache. A weekly deployment checks for a master replaced at the
same R2 URL, so future rendition rebuilds are unattended as well. The pipeline
enforces a publication budget below GitHub Pages' 1 GB site limit.

Encoding settings and source URLs live in `media/camcorder.pipeline.json`; the
pipeline implementation is `scripts/media/pipeline.mjs`.
