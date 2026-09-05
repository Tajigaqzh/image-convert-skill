#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');

let sharp;
try {
  const require = createRequire(path.join(skillRoot, 'package.json'));
  sharp = require('sharp');
} catch {
  try {
    const require = createRequire(path.resolve(process.cwd(), 'package.json'));
    sharp = require('sharp');
  } catch {
    console.log('Sharp not found. Installing dependencies...');
    try {
      execSync('npm install', { cwd: skillRoot, stdio: 'inherit' });
      const require = createRequire(path.join(skillRoot, 'package.json'));
      sharp = require('sharp');
    } catch {
      console.error('Failed to install dependencies.');
      console.error(`Please manually run: cd ${skillRoot} && npm install`);
      process.exit(2);
    }
  }
}

const inputExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.svg',
  '.webp',
  '.avif',
  '.heic',
  '.heif',
  '.jp2',
  '.j2k',
]);

const outputFormats = {
  webp: { extension: 'webp', method: 'webp', quality: true },
  png: { extension: 'png', method: 'png', quality: true },
  jpeg: { extension: 'jpeg', method: 'jpeg', quality: true },
  jpg: { extension: 'jpg', method: 'jpeg', quality: true },
  avif: { extension: 'avif', method: 'avif', quality: true },
  tiff: { extension: 'tiff', method: 'tiff', quality: true },
  tif: { extension: 'tif', method: 'tiff', quality: true },
  gif: { extension: 'gif', method: 'gif', quality: false },
  heif: { extension: 'heif', method: 'heif', quality: true },
  heic: { extension: 'heic', method: 'heif', quality: true },
  jp2: { extension: 'jp2', method: 'jp2', quality: true },
};

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node convert-image.mjs <file-or-folder> [options]

Options:
  --recursive         Process subdirectories recursively
  --format=FORMAT     Output format (default: webp)
  --to=FORMAT         Alias for --format
  --quality=N         Output quality (1-100, default: 100)
  --output-dir=PATH   Save converted files to specified directory
  --overwrite         Overwrite existing output files
  --skip-existing     Skip conversion if output file exists
  --dry-run           Preview files to be converted without converting
  --no-progress       Disable progress bar
  --width=N           Resize width (maintains aspect ratio if height not set)
  --height=N          Resize height (maintains aspect ratio if width not set)
  --fit=MODE          Resize fit mode: cover, contain, fill, inside, outside (default: inside)
  --preserve-metadata Preserve EXIF and other metadata
  --parallel=N        Process N images in parallel (default: CPU cores - 1, max: 16)
  --report            Show detailed conversion report with file sizes (default on)
  --no-report         Disable the conversion report
  --help, -h          Show this help message

Supported output formats: ${Object.keys(outputFormats).join(', ')}

Examples:
  node convert-image.mjs path/to/image.png --format=webp
  node convert-image.mjs path/to/folder --recursive --to=jpeg --quality=85
  node convert-image.mjs path/to/folder --output-dir=./converted --overwrite
  node convert-image.mjs path/to/folder --dry-run
  node convert-image.mjs path/to/image.jpg --width=800 --height=600 --fit=cover
  node convert-image.mjs path/to/folder --preserve-metadata --parallel=4 --report`);
  process.exit(0);
}

const input = args.find((arg) => !arg.startsWith('--'));
const recursive = args.includes('--recursive');
const qualityArg = args.find((arg) => arg.startsWith('--quality='));
const quality = qualityArg ? Number(qualityArg.split('=')[1]) : 100;
const formatArg = args.find((arg) => arg.startsWith('--format=') || arg.startsWith('--to='));
const requestedFormat = formatArg
  ? formatArg.split('=')[1].toLowerCase().replace(/^\./, '')
  : 'webp';
const outputFormat = outputFormats[requestedFormat];
const outputDirArg = args.find((arg) => arg.startsWith('--output-dir='));
const outputDir = outputDirArg ? outputDirArg.split('=')[1] : null;
const overwrite = args.includes('--overwrite');
const skipExisting = args.includes('--skip-existing');
const dryRun = args.includes('--dry-run');
const showProgress = !args.includes('--no-progress');
const widthArg = args.find((arg) => arg.startsWith('--width='));
const heightArg = args.find((arg) => arg.startsWith('--height='));
const width = widthArg ? Number(widthArg.split('=')[1]) : null;
const height = heightArg ? Number(heightArg.split('=')[1]) : null;
const fitArg = args.find((arg) => arg.startsWith('--fit='));
const fit = fitArg ? fitArg.split('=')[1] : 'inside';
const preserveMetadata = args.includes('--preserve-metadata');
const parallelArg = args.find((arg) => arg.startsWith('--parallel='));
const cpuCount = os.cpus().length || 1;
const defaultParallel = Math.max(1, Math.min(cpuCount - 1, 16));
const parallel = parallelArg ? Math.max(1, Math.min(Number(parallelArg.split('=')[1]), 16)) : defaultParallel;
const showReport = !args.includes('--no-report');

const validFitModes = ['cover', 'contain', 'fill', 'inside', 'outside'];
if (!validFitModes.includes(fit)) {
  console.error(`Error: Invalid fit mode "${fit}". Must be one of: ${validFitModes.join(', ')}`);
  process.exit(1);
}

if (!input || !outputFormat || !Number.isInteger(quality) || quality < 1 || quality > 100) {
  console.error('Usage: node convert-image.mjs <file-or-folder> [--recursive] [--format=FORMAT] [--quality=1..100]');
  console.error(`Supported output formats: ${Object.keys(outputFormats).join(', ')}`);
  process.exit(1);
}

if (overwrite && skipExisting) {
  console.error('Error: --overwrite and --skip-existing cannot be used together');
  process.exit(1);
}

// Create output directory if specified
if (outputDir && !dryRun) {
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create output directory: ${error.message}`);
    process.exit(1);
  }
}

async function collect(target) {
  const stat = await fs.stat(target);
  if (stat.isFile()) return [target];

  const entries = await fs.readdir(target, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.join(target, entry.name);
    if (entry.isFile()) files.push(child);
    else if (recursive && entry.isDirectory()) files.push(...await collect(child));
  }
  return files;
}

// Simple progress bar function
function drawProgress(current, total, barLength = 30) {
  if (!showProgress) return;
  const percent = Math.floor((current / total) * 100);
  const filled = Math.floor((current / total) * barLength);
  const bar = '='.repeat(filled) + '-'.repeat(barLength - filled);
  process.stdout.write(`\r[${bar}] ${percent}% (${current}/${total})`);
  if (current === total) process.stdout.write('\n');
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function buildTable(rows, headers) {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => String(row[index]).length))
  );
  const line = (cells) => `| ${cells.map((cell, index) => String(cell).padEnd(widths[index])).join(' | ')} |`;
  const separator = `|-${widths.map((width) => '-'.repeat(width)).join('-|-')}-|`;
  return [line(headers), separator, ...rows.map(line)].join('\n');
}

// Process a single file
async function processFile(source, outputPath, stats) {
  const sourceSize = showReport ? (await fs.stat(source)).size : 0;
  const startTime = Date.now();

  let image = sharp(source);

  // Apply resize if specified
  if (width || height) {
    const resizeOptions = { fit };
    if (width) resizeOptions.width = width;
    if (height) resizeOptions.height = height;
    image = image.resize(resizeOptions);
  }

  // Preserve metadata if requested
  if (preserveMetadata) {
    image = image.withMetadata();
  }

  const options = outputFormat.quality ? { quality } : undefined;
  await image[outputFormat.method](options).toFile(outputPath);

  if (showReport) {
    const outputSize = (await fs.stat(outputPath)).size;
    const duration = Date.now() - startTime;
    const ratio = sourceSize === 0 ? 0 : (1 - outputSize / sourceSize) * 100;
    stats.push({
      source,
      output: outputPath,
      sourceSize,
      outputSize,
      ratio,
      duration
    });
  }
}

// Worker pool for parallel processing
async function processInParallel(tasks, concurrency) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const promise = task().then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });
    results.push(promise);
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

const files = await collect(input);
let converted = 0;
let skipped = 0;
let failed = 0;
let exists = 0;
let processed = 0;
const conversionStats = [];

if (dryRun) {
  console.log('DRY RUN MODE - No files will be converted\n');
}

if (parallel > 1 && !dryRun) {
  console.log(`Using ${parallel} parallel workers\n`);
}

// Prepare conversion tasks
const tasks = [];

for (const source of files) {
  const sourceExtension = path.extname(source).toLowerCase();
  if (!inputExtensions.has(sourceExtension)) {
    skipped += 1;
    continue;
  }

  const basename = path.basename(source, path.extname(source));
  const outputFilename = `${basename}.${outputFormat.extension}`;

  let output;
  if (outputDir) {
    const relativePath = path.relative(input, path.dirname(source));
    const targetDir = path.join(outputDir, relativePath);
    if (!dryRun) {
      await fs.mkdir(targetDir, { recursive: true });
    }
    output = path.join(targetDir, outputFilename);
  } else {
    output = path.join(path.dirname(source), outputFilename);
  }

  if (path.resolve(output) === path.resolve(source)) {
    skipped += 1;
    continue;
  }

  // Check if output exists
  try {
    await fs.access(output);
    if (skipExisting) {
      exists += 1;
      continue;
    }
    if (!overwrite && !dryRun) {
      console.log(`EXISTS (use --overwrite to replace): ${output}`);
      exists += 1;
      continue;
    }
  } catch {
    // File doesn't exist, proceed
  }

  if (dryRun) {
    console.log(`${source} -> ${output}`);
    converted += 1;
  } else {
    tasks.push({ source, output });
  }
}

// Process tasks
if (!dryRun && tasks.length > 0) {
  const processTasks = tasks.map(({ source, output }, index) => async () => {
    try {
      if (showProgress) {
        console.log(`[${index + 1}/${tasks.length}] ${path.basename(source)}`);
      }
      await processFile(source, output, conversionStats);
      if (!showProgress) console.log(output);
      converted += 1;
    } catch (error) {
      if (!showProgress) console.error(`FAILED ${source}: ${error.message}`);
      failed += 1;
    }
    processed += 1;
    if (showProgress) drawProgress(processed, tasks.length);
  });

  if (parallel > 1) {
    await processInParallel(processTasks, parallel);
  } else {
    for (const task of processTasks) {
      await task();
    }
  }
}

if (showProgress && !dryRun && tasks.length > 0) console.log('');

// Show detailed report
if (showReport && conversionStats.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('CONVERSION REPORT');
  console.log('='.repeat(80));

  const totalSourceSize = conversionStats.reduce((sum, s) => sum + s.sourceSize, 0);
  const totalOutputSize = conversionStats.reduce((sum, s) => sum + s.outputSize, 0);
  const totalSaved = totalSourceSize - totalOutputSize;
  const totalDuration = conversionStats.reduce((sum, s) => sum + s.duration, 0);
  const totalRatio = totalSourceSize === 0 ? 0 : (1 - totalOutputSize / totalSourceSize) * 100;
  const bestConversion = conversionStats.reduce((best, stat) => (stat.ratio > best.ratio ? stat : best), conversionStats[0]);

  const fileRows = conversionStats.map((stat) => [
    path.basename(stat.source),
    formatBytes(stat.sourceSize),
    formatBytes(stat.outputSize),
    formatPercent(stat.ratio),
    `${stat.duration}ms`,
  ]);

  console.log('\nPer-file results:');
  console.log(buildTable(fileRows, ['File', 'Original Size', 'Converted Size', 'Compression', 'Time']));
  console.log('\nSummary:');
  console.log(buildTable([
    ['Total', formatBytes(totalSourceSize), formatBytes(totalOutputSize), formatPercent(totalRatio), `${formatBytes(totalSaved)} saved`],
  ], ['Type', 'Original Size', 'Converted Size', 'Compression', 'Notes']));
  console.log(buildTable([
    [path.basename(bestConversion.source), formatBytes(bestConversion.sourceSize), formatBytes(bestConversion.outputSize), formatPercent(bestConversion.ratio), `${bestConversion.duration}ms`],
  ], ['Best File', 'Original Size', 'Converted Size', 'Compression', 'Time']));
  console.log(`\nTotal time: ${(totalDuration / 1000).toFixed(2)}s (${totalDuration}ms)`);
  console.log('='.repeat(80) + '\n');
}

const summary = [
  dryRun ? `Would convert ${converted} file(s)` : `Converted ${converted} file(s) to ${outputFormat.extension}`,
  skipped > 0 ? `skipped ${skipped}` : null,
  exists > 0 ? `already exists ${exists}` : null,
  failed > 0 ? `failed ${failed}` : null,
].filter(Boolean).join(', ');

console.log(summary);
process.exitCode = failed > 0 ? 1 : 0;
