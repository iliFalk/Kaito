#!/usr/bin/env node
/**
 * scripts/vendorize.js
 *
 * Finds external asset URLs (CDN links) across the repository, downloads them into
 * public/vendor, removes SRI (integrity) attributes, rewrites CSS url() references,
 * and replaces references across files to point to the downloaded local copies.
 *
 * Usage:
 *   node scripts/vendorize.js        # performs changes (downloads + overwrites files)
 *   node scripts/vendorize.js --dry  # performs a dry-run, prints planned actions but doesn't write files
 *
 * Notes / heuristics:
 * - Skips node_modules, .git, public/vendor, and any path that matches skipDirs.
 * - Only considers files with extensions in textExts for scanning and replacement.
 * - Decides a URL is an "asset" to download if:
 *    * the URL ends with a known asset extension (js, css, png, jpg, svg, woff, woff2, ttf, map, etc.)
 *    OR
 *    * the hostname matches common CDN patterns (cdn, jsdelivr, unpkg, aistudiocdn, cloudflare, googleapis, fonts.gstatic, etc.)
 * - Creates a manifest public/vendor/manifest.json that maps original URL -> local path
 *
 * IMPORTANT:
 * - This script will modify files in-place when not run with --dry.
 * - Review the manifest after running; if something shouldn't be vendored, restore from git before committing.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

const repoRoot = process.cwd();
const outVendorDir = path.join(repoRoot, 'public', 'vendor');
const skipDirs = ['node_modules', '.git', 'public/vendor', 'dist', 'build'];
const textExts = new Set([
  '.html', '.htm', '.css', '.js', '.mjs', '.ts', '.tsx', '.jsx', '.json', '.svg', '.md', '.scss', '.less'
]);

const assetExts = new Set([
  '.js', '.mjs', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.map', '.ico', '.json', '.bmp', '.avif'
]);

const cdnHostPatterns = [
  /cdn/i,
  /jsdelivr\.net/i,
  /unpkg\.com/i,
  /aistudiocdn\.com/i,
  /cdnjs\.cloudflare\.com/i,
  /cdn\.tailwindcss\.com/i,
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /ajax\.googleapis\.com/i,
  /cdn\.jsdelivr\.net/i,
  /esm\.sh/i,
  /esm\.run/i
];

const dryRun = process.argv.includes('--dry');

function isTextFile(filePath) {
  return textExts.has(path.extname(filePath).toLowerCase());
}

function shouldSkip(dir) {
  return skipDirs.some(s => {
    // match segment start to avoid accidental partial matches
    const seg = `/${s}/`;
    return dir.includes(seg) || dir.endsWith(`/${s}`) || dir === s;
  });
}

function isLikelyAssetUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const ext = path.extname(u.pathname).toLowerCase();
    if (assetExts.has(ext)) return true;
    // If no extension but hostname looks like CDN, treat as asset (e.g. tailwind CDN)
    if (cdnHostPatterns.some(rx => rx.test(u.hostname))) return true;
    return false;
  } catch (e) {
    return false;
  }
}

function safeFilenameFromUrl(urlStr) {
  // Keep original extension if present, otherwise use .bin
  try {
    const u = new URL(urlStr);
    const ext = path.extname(u.pathname) || '';
    const hash = crypto.createHash('sha1').update(urlStr).digest('hex').slice(0, 10);
    const cleanHost = u.hostname.replace(/[:/\\]/g, '_');
    const name = path.basename(u.pathname) || '';
    const sanitizedName = name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filename = sanitizedName ? `${hash}_${sanitizedName}` : `${hash}${ext || '.bin'}`;
    return { dir: cleanHost, filename };
  } catch (e) {
    const hash = crypto.createHash('sha1').update(urlStr).digest('hex').slice(0, 10);
    return { dir: 'misc', filename: `${hash}.bin` };
  }
}

function mkdirpSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function downloadToFile(urlStr, destPath) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const get = u.protocol === 'https:' ? https.get : http.get;
    const req = get(urlStr, { timeout: 30_000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        return resolve(downloadToFile(new URL(res.headers.location, u).toString(), destPath));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed: ${urlStr} -> ${res.statusCode}`));
      }
      mkdirpSync(path.dirname(destPath));
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => fileStream.close(() => resolve(destPath)));
      fileStream.on('error', (err) => reject(err));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
  });
}

function findFilesRecursive(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of list) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (shouldSkip(full)) continue;
      results = results.concat(findFilesRecursive(full));
    } else if (ent.isFile()) {
      // skip binary-ish files (we'll only scan textExts)
      results.push(full);
    }
  }
  return results;
}

function collectCandidateUrlsFromContent(content) {
  // Find https://... occurrences in strings, src/href attributes, CSS url() usage
  // Keep capture fairly permissive but avoid trailing punctuation
  const regex = /https?:\/\/[^\s"'()<>]+/g;
  const set = new Set();
  let m;
  while ((m = regex.exec(content)) !== null) {
    const raw = m[0].replace(/[),.;]+$/g, ''); // strip trailing punctuation often next to url
    set.add(raw);
  }
  return Array.from(set);
}

function removeSRIAndCrossorigin(content) {
  // Remove or and etc.
  content = content.replace(/\s+integrity\s*=\s*"(?:[^"]*)"/gi, '');
  content = content.replace(/\s+integrity\s*=\s*'(?:[^']*)'/gi, '');
  content = content.replace(/\s+crossorigin\s*=\s*"(?:[^"]*)"/gi, '');
  content = content.replace(/\s+crossorigin\s*=\s*'(?:[^']*)'/gi, '');
  return content;
}

(async function main() {
  console.log('Vendorize script started. dryRun=', !!dryRun);
  mkdirpSync(outVendorDir);
  const allFiles = findFilesRecursive(repoRoot)
    // ignore this script itself and the vendor dir
    .filter(f => !f.includes(path.join(repoRoot, 'scripts', 'vendorize.js')))
    .filter(f => !f.includes(path.join(repoRoot, 'public', 'vendor')))
    .filter(f => !f.includes(path.join(repoRoot, '.git')))
    .filter(f => !f.includes(path.join(repoRoot, 'node_modules')));

  // Filter to text files we care about for scanning/replacement
  const candidateFiles = allFiles.filter(f => isTextFile(f));
  console.log(`Scanning ${candidateFiles.length} text files for external URLs...`);

  const urlToOccurrences = {}; // url -> [{file, indices?}] - we only need file list
  for (const file of candidateFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const urls = collectCandidateUrlsFromContent(content);
      for (const u of urls) {
        if (!isLikelyAssetUrl(u)) continue;
        if (!urlToOccurrences[u]) urlToOccurrences[u] = new Set();
        urlToOccurrences[u].add(file);
      }
    } catch (e) {
      // skip unreadable files
    }
  }

  const urls = Object.keys(urlToOccurrences);
  console.log(`Found ${urls.length} candidate external asset URLs.`);

  if (urls.length === 0) {
    console.log('No vendorable external asset URLs found. Exiting.');
    process.exit(0);
  }

  // Plan downloads
  const plan = [];
  for (const url of urls) {
    const { dir: hostDir, filename } = safeFilenameFromUrl(url);
    const outDir = path.join(outVendorDir, hostDir);
    const outPath = path.join(outDir, filename);
    const webPath = path.posix.join('/vendor', hostDir, filename); // path to use in replacements
    plan.push({
      url,
      outDir,
      outPath,
      webPath,
      files: Array.from(urlToOccurrences[url]).map(p => path.relative(repoRoot, p))
    });
  }

  // Print plan summary
  console.log('Plan (first 50 shown):');
  for (const p of plan.slice(0, 50)) {
    console.log(`- ${p.url} -> ${p.webPath} (used in ${p.files.length} files)`);
  }
  if (dryRun) {
    console.log('\nDry-run mode: no files will be downloaded nor changed. Run without --dry to apply changes.');
  }

  // Download step
  const manifest = {};
  for (const p of plan) {
    if (!fs.existsSync(p.outPath)) {
      console.log(`Downloading: ${p.url} -> ${p.outPath}`);
      if (!dryRun) {
        try {
          mkdirpSync(p.outDir);
          await downloadToFile(p.url, p.outPath);
          console.log('  downloaded.');
        } catch (err) {
          console.error('  failed to download:', err.message);
          continue;
        }
      } else {
        console.log('  (dry) skipping download');
      }
    } else {
      console.log(`Already exists: ${p.outPath}, skipping download.`);
    }
    manifest[p.url] = p.webPath;
  }

  // Replace references across files + remove SRI attributes
  for (const file of candidateFiles) {
    const rel = path.relative(repoRoot, file);
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (e) {
      console.warn('Could not read', file);
      continue;
    }
    let modified = false;

    // Remove integrity/crossorigin attributes
    const cleaned = removeSRIAndCrossorigin(content);
    if (cleaned !== content) {
      content = cleaned;
      modified = true;
    }

    // Replace all URLs that are in manifest
    for (const [origUrl, localPath] of Object.entries(manifest)) {
      // Replace raw occurrences, and url(...) occurrences
      if (content.includes(origUrl)) {
        // Replace full URL with local path (rooted at /vendor/...)
        content = content.split(origUrl).join(localPath);
        modified = true;
      }

      // CSS url("https://..."), url('https://...'), url(https://...)
      const cssUrlQuoted = new RegExp(`url\\((['"]?)${escapeRegExp(origUrl)}\\1\\)`, 'g');
      if (cssUrlQuoted.test(content)) {
        content = content.replace(cssUrlQuoted, `url("${localPath}")`);
        modified = true;
      }
    }

    if (modified) {
      console.log(`Updating file: ${rel}`);
      if (!dryRun) {
        fs.writeFileSync(file, content, 'utf8');
      } else {
        console.log('  (dry) would write changes.');
      }
    }
  }

  // Write manifest to outVendorDir
  const manifestPath = path.join(outVendorDir, 'manifest.json');
  if (!dryRun) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('Wrote manifest to', path.relative(repoRoot, manifestPath));
  } else {
    console.log('(dry) would write manifest to', manifestPath);
  }

  console.log('Vendorize completed. Summary:');
  console.log(`- total asset URLs processed: ${Object.keys(manifest).length}`);
  console.log(`- vendor directory: ${path.relative(repoRoot, outVendorDir)}`);
  console.log('\nNext recommended steps:');
  console.log('1) Inspect public/vendor/manifest.json and changed files.');
  console.log('2) Run the app / build to verify assets load correctly.');
  console.log('3) Commit the changes (git add public/vendor and modified source files).');

  process.exit(0);
})();

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
