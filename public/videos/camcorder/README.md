# Camcorder video files

Do not put the large video masters in this repository. Upload them to a public
Cloudflare R2 bucket, then paste their public HTTPS URLs into `src/media.js`.

Use these object names in R2:

- `camcorder/footage.mp4`
- `camcorder/cad-video.mp4`
- `camcorder/external-footage.mov`

The player streams the remote files with browser controls and only preloads
their metadata. The original objects are not modified by the website.

`external-footage.mp4` is a browser-compatible playback copy of the external
MOV. Its H.264 video and AAC audio were copied without re-encoding, while the
unsupported spatial-audio and camera-metadata tracks were left out. The MOV in
R2 remains the original master.
