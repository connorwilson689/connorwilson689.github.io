# Camcorder video files

Do not put the large video masters in this repository. Upload them to a public
Cloudflare R2 bucket, then paste their public HTTPS URLs into `src/media.js`.

Use these object names in R2:

- `camcorder/footage.mp4`
- `camcorder/cad-video.mp4`

The player streams the remote files with browser controls and only preloads
their metadata. The original objects are not modified by the website.
