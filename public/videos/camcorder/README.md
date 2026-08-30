# Camcorder video files

Do not put the large video masters in this repository. Upload them to a public
Cloudflare R2 bucket, then add their public HTTPS URLs to `src/media.js`.

The current source objects are:

- `camcorder/footage.mp4` (4K master)
- `camcorder/cad-video.mp4` (4K master)
- `camcorder/external-footage.mp4` (1080p)

For 1080p inline playback, create these sidecars in the same bucket:

- `camcorder/footage-1080p.mp4`
- `camcorder/cad-video-1080p.mp4`

Encode web renditions as H.264/AAC with `yuv420p` pixel format and fast-start
metadata. For example:

```sh
ffmpeg -i footage-master.mp4 -vf "scale=-2:1080" -c:v libx264 -preset slow \
  -profile:v high -crf 21 -maxrate 12M -bufsize 24M -pix_fmt yuv420p \
  -tag:v avc1 -c:a aac -b:a 192k -movflags +faststart footage-1080p.mp4
```

After uploading a sidecar, add it as the `hd` source next to the existing `uhd`
source in `src/media.js`. When both exist, the player exposes Auto, 1080p, and
4K quality choices. Auto uses 1080p inline and switches to 4K in fullscreen only
when the display has more than 1080p of physical resolution and data saver is
off. The explicit 4K choice remains available as an override. On iOS native
fullscreen, select 4K before entering fullscreen to avoid reloading the native
player during the transition.
Until those `hd` entries are configured, footage and CAD still use their 4K
fallback inline.

For faster fullscreen playback, also preserve the masters separately and create
web-optimized `footage-2160p.mp4` and `cad-video-2160p.mp4` renditions at a lower
bitrate with `+faststart`. Point the `uhd` entries at those web renditions after
they are uploaded.

The configured `r2.dev` hostname is intended for development traffic. For
production delivery, connect the same R2 bucket to a custom domain; this changes
the public URLs without moving the stored objects.

The player defers source attachment until it is near the viewport, requests no
video preload, uses local poster frames, pauses offscreen playback, and allows
only one project video to play at a time. Existing video objects are not modified
by the website.
