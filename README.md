# Image Convert

Convert images between common raster formats with customizable quality settings.

## Features

- 🚀 Supports multiple formats: WebP, PNG, JPEG, AVIF, TIFF, GIF, HEIF/HEIC, JP2
- 🔄 Bidirectional conversion between all supported formats
- ⚙️ Customizable quality (1-100)
- 📏 Image resizing with multiple fit modes (cover, contain, fill, inside, outside)
- 📋 Preserve EXIF metadata and image information
- ⚡ Parallel processing for faster batch conversions
- 📊 Detailed conversion reports with file size comparison and compression ratios
- 📁 Batch conversion with recursive directory support
- 🔄 Automatic dependency installation
- 📈 Real-time progress bar
- 🎯 Smart file handling (skip existing, overwrite, dry-run)

## Installation

### One-Click Install (Recommended)

```bash
claude marketplace add https://github.com/Tajigaqzh/image-convert
claude plugin install image-convert@image-convert-marketplace
```

### Manual Install

```bash
git clone https://github.com/Tajigaqzh/image-convert.git ~/.codex/skills/image-convert
cd ~/.codex/skills/image-convert
npm install
```

## Usage

### Convert a single image

```bash
/image-convert path/to/image.png --format=webp
```

### Convert to different formats

```bash
# PNG to JPEG
/image-convert path/to/image.png --format=jpeg --quality=85

# WebP to PNG
/image-convert path/to/image.webp --to=png

# JPEG to AVIF
/image-convert photo.jpg --format=avif --quality=80
```

### Convert a folder

```bash
/image-convert path/to/folder --format=webp
```

### Convert recursively with custom quality

```bash
/image-convert path/to/folder --recursive --format=jpeg --quality=90
```

### Show help

```bash
/image-convert --help
```

## Options

- `--format=FORMAT` - Output format (default: webp)
- `--to=FORMAT` - Alias for --format
- `--quality=N` - Output quality (1-100, default: 100)
- `--recursive` - Process subdirectories recursively
- `--output-dir=PATH` - Save converted files to specified directory
- `--overwrite` - Overwrite existing output files
- `--skip-existing` - Skip conversion if output file exists
- `--dry-run` - Preview files to be converted without converting
- `--no-progress` - Disable progress bar
- `--width=N` - Resize width (maintains aspect ratio if height not set)
- `--height=N` - Resize height (maintains aspect ratio if width not set)
- `--fit=MODE` - Resize fit mode: cover, contain, fill, inside, outside (default: inside)
- `--preserve-metadata` - Preserve EXIF and other metadata
- `--parallel=N` - Process N images in parallel (default: 1, max: 16)
- `--report` - Show detailed conversion report with file sizes and compression ratios
- `--help, -h` - Show help message

## Supported Formats

### Input Formats
PNG, JPG/JPEG, GIF, BMP, TIFF, SVG, WebP, AVIF, HEIF/HEIC, JP2

### Output Formats
`webp`, `png`, `jpeg`, `jpg`, `avif`, `tiff`, `tif`, `gif`, `heif`, `heic`, `jp2`

## Examples

```bash
# Convert single image to WebP at 100% quality
/image-convert logo.png --format=webp

# Convert all images in a folder to JPEG at 85% quality
/image-convert ./images --format=jpeg --quality=85

# Convert all images recursively to PNG
/image-convert ./assets --recursive --to=png

# Convert WebP back to original format
/image-convert photo.webp --format=jpeg

# Save converted files to a separate directory
/image-convert ./images --format=webp --output-dir=./webp-images

# Preview what would be converted without actually converting
/image-convert ./folder --dry-run --recursive

# Overwrite existing files
/image-convert ./images --format=jpeg --overwrite

# Skip files that already exist
/image-convert ./images --format=png --skip-existing

# Resize images to 800px width (maintains aspect ratio)
/image-convert ./photos --format=webp --width=800

# Resize to specific dimensions with cover fit (crops to fit)
/image-convert ./images --width=1200 --height=630 --fit=cover

# Preserve EXIF metadata (camera info, GPS, etc.)
/image-convert ./photos --format=jpeg --preserve-metadata

# Use 4 parallel workers for faster batch conversion
/image-convert ./large-folder --recursive --parallel=4

# Show detailed report with file sizes and compression ratios
/image-convert ./images --format=webp --report

# Complete optimization workflow
/image-convert ./assets --recursive --format=webp --quality=90 --width=1920 --preserve-metadata --parallel=4 --report --output-dir=./optimized
```

## Output

- Creates converted files with new extension in the same directory as source files
- Original files are preserved
- Shows conversion statistics including converted, skipped, and failed files
- Detailed error messages for any failures

## Requirements

- Node.js 14+
- sharp package (auto-installed)

## License

MIT

## Author

Tajigaqzh - [GitHub](https://github.com/Tajigaqzh)
