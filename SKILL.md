---
name: image-convert
description: Convert one image or a folder of image assets between common raster formats using Sharp when the user requests a format conversion. Supports resizing, metadata preservation, parallel processing, and detailed reporting.
---

# Image Convert

Use this skill for single-file or batch image conversion. Run `scripts/convert-image.mjs` with Node.js and use `--format=FORMAT` (or `--to=FORMAT`) for the requested output suffix. The default is WebP for compatibility with older image-to-webp workflows.

Supported output formats are `webp`, `png`, `jpeg`, `jpg`, `avif`, `tiff`, `tif`, `gif`, `heif`, `heic`, and `jp2`. Inputs may be PNG, JPG/JPEG, GIF, BMP, TIFF, SVG, WebP, AVIF, HEIF/HEIC, or JP2 when supported by the installed Sharp/libvips build. Quality accepts 1-100 where the encoder supports it; GIF ignores quality.

## Features

- Format conversion between all supported formats
- Image resizing with multiple fit modes (cover, contain, fill, inside, outside)
- EXIF metadata preservation
- Parallel processing (up to 16 workers)
- Detailed conversion reports with file size comparison and compression ratios
- Progress bar for batch operations
- Smart file handling (skip existing, overwrite, dry-run preview)

Examples:

```bash
node scripts/convert-image.mjs path/to/image.png --format=webp
node scripts/convert-image.mjs path/to/folder --recursive --to=png
node scripts/convert-image.mjs path/to/image.webp --format=jpeg --quality=85
node scripts/convert-image.mjs path/to/folder --output-dir=./converted --overwrite
node scripts/convert-image.mjs path/to/folder --dry-run --recursive
node scripts/convert-image.mjs path/to/image.jpg --width=800 --height=600 --fit=cover
node scripts/convert-image.mjs path/to/folder --preserve-metadata --parallel=4 --report
```

Options: `--format=FORMAT` (or `--to=FORMAT`), `--quality=N`, `--recursive`, `--output-dir=PATH`, `--overwrite`, `--skip-existing`, `--dry-run`, `--no-progress`, `--width=N`, `--height=N`, `--fit=MODE`, `--preserve-metadata`, `--parallel=N`, `--report`

Write same-basename outputs beside each source, preserve originals, skip unsupported inputs and sources whose output path is identical, and report conversion failures. Do not delete sources or update repository references unless the user explicitly asks. If Sharp is unavailable, install dependencies in the skill directory with `npm install` (or `pnpm add -D sharp`) before retrying.
