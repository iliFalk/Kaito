#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');

function ensure(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copy(srcRelative, destRelative) {
  const src = path.resolve(root, srcRelative);
  const dest = path.resolve(dist, destRelative);
  if (!fs.existsSync(src)) {
    console.warn(`prepare-dist: source not found, skipping: ${srcRelative}`);
    return;
  }
  ensure(path.dirname(dest));
  fs.cpSync(src, dest, { recursive: true });
  console.log(`Copied ${srcRelative} -> ${destRelative}`);
}

(async () => {
  try {
    ensure(dist);

    // Copy manifest, service worker, icons, content folder and any top-level files needed
    copy('manifest.json', 'manifest.json');
    copy('service_worker.js', 'service_worker.js');
    copy('icons', 'icons');
    copy('content', 'content');

    // If sidepanel build exists, move it into dist/sidepanel (Vite build writes to dist/sidepanel)
    const builtSidepanel = path.resolve(root, 'dist', 'sidepanel');
    if (fs.existsSync(builtSidepanel)) {
      // Already in dist/sidepanel from Vite build; nothing more to do.
      console.log('Sidepanel build detected at dist/sidepanel');
    } else {
      console.warn('No sidepanel build found at dist/sidepanel — run "npm run build:sidepanel" first');
    }

    console.log('prepare-dist: done. Distribution is ready in ./dist');
  } catch (err) {
    console.error('prepare-dist: error', err);
    process.exit(1);
  }
})();
