import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

function readPngDimensions(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  const signature = buf.subarray(0, 8).toString('hex');
  assert.equal(signature, '89504e470d0a1a0a', `${path.basename(filePath)} should have a valid PNG signature`);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

test('seo_meta_assets: favicon.ico exists and contains valid 32x32 and 48x48 ICO directory entries', () => {
  const icoPath = path.join(publicDir, 'favicon.ico');
  assert.ok(fs.existsSync(icoPath), 'public/favicon.ico should exist');

  const buf = fs.readFileSync(icoPath);
  assert.ok(buf.length > 22, 'favicon.ico should have header and image data');

  const reserved = buf.readUInt16LE(0);
  const type = buf.readUInt16LE(2);
  const count = buf.readUInt16LE(4);

  assert.equal(reserved, 0, 'ICO reserved field should be 0');
  assert.equal(type, 1, 'ICO type field should be 1');
  assert.equal(count, 2, 'favicon.ico should contain 2 icon frames (32x32 and 48x48)');

  const widths: number[] = [];
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    const offset = 6 + i * 16;
    widths.push(buf.readUInt8(offset));
    heights.push(buf.readUInt8(offset + 1));
  }
  assert.deepEqual(widths, [32, 48]);
  assert.deepEqual(heights, [32, 48]);
});

test('seo_meta_assets: all app icons and favicons exist with expected dimensions', () => {
  const expectedPngs: Array<{ file: string; width: number; height: number }> = [
    { file: 'favicon-32x32.png', width: 32, height: 32 },
    { file: 'favicon-48x48.png', width: 48, height: 48 },
    { file: 'apple-touch-icon.png', width: 180, height: 180 },
    { file: 'pwa-192x192.png', width: 192, height: 192 },
    { file: 'pwa-512x512.png', width: 512, height: 512 },
    { file: 'pwa-maskable-192x192.png', width: 192, height: 192 },
    { file: 'pwa-maskable-512x512.png', width: 512, height: 512 },
    { file: 'og-image.png', width: 1200, height: 630 },
  ];

  for (const item of expectedPngs) {
    const fullPath = path.join(publicDir, item.file);
    assert.ok(fs.existsSync(fullPath), `public/${item.file} should exist`);
    const dims = readPngDimensions(fullPath);
    assert.equal(dims.width, item.width, `${item.file} width should be ${item.width}`);
    assert.equal(dims.height, item.height, `${item.file} height should be ${item.height}`);
  }

  for (const svgFile of ['favicon.svg', 'icon.svg']) {
    const svgPath = path.join(publicDir, svgFile);
    assert.ok(fs.existsSync(svgPath), `public/${svgFile} should exist`);
    const content = fs.readFileSync(svgPath, 'utf-8');
    assert.match(content, /<svg[^>]*viewBox="0 0 512 512"/);
  }

  assert.equal(
    fs.existsSync(path.join(publicDir, 'icons.svg')),
    false,
    'unused scaffold file public/icons.svg should be removed'
  );
});

test('seo_meta_assets: manifest.webmanifest has valid metadata, theme colors, and existing icon files', () => {
  const manifestPath = path.join(publicDir, 'manifest.webmanifest');
  assert.ok(fs.existsSync(manifestPath), 'public/manifest.webmanifest should exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert.equal(manifest.short_name, 'TurfTalk');
  assert.equal(manifest.lang, 'ja');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#0D3322');
  assert.equal(manifest.background_color, '#ECE6D8');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 5);

  for (const icon of manifest.icons) {
    const relPath = String(icon.src).replace(/^\.\//, '');
    assert.ok(
      fs.existsSync(path.join(publicDir, relPath)),
      `Manifest icon ${icon.src} should exist in public/`
    );
  }
});

test('seo_meta_assets: index.html includes optimized SEO meta tags, icon links, and accessible viewport', () => {
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const html = fs.readFileSync(indexHtmlPath, 'utf-8');

  assert.match(html, /<html\s+lang="ja">/);
  assert.match(html, /<title>TurfTalk \| 海外競馬英語マイクロラーニング<\/title>/);

  // Description & Keywords
  assert.match(html, /<meta\s+name="description"\s+content="[^"]*海外G1[^"]*"\s*\/>/s);
  assert.match(html, /<meta\s+name="keywords"\s+content="[^"]*海外競馬[^"]*競馬英語[^"]*TurfTalk[^"]*"\s*\/>/s);

  // OGP & Twitter Card
  assert.match(html, /<meta\s+property="og:title"\s+content="TurfTalk \| 海外競馬英語マイクロラーニング"\s*\/>/);
  assert.match(html, /<meta\s+property="og:type"\s+content="website"\s*\/>/);
  assert.match(html, /<meta\s+property="og:image"\s+content="\.\/og-image\.png"\s*\/>/);
  assert.match(html, /<meta\s+name="twitter:card"\s+content="summary_large_image"\s*\/>/);
  assert.match(html, /<meta\s+name="twitter:image"\s+content="\.\/og-image\.png"\s*\/>/);

  // Favicon & Apple Touch Icon links
  assert.match(html, /<link\s+rel="icon"\s+href="\.\/favicon\.ico"\s+sizes="48x48"\s*\/>/);
  assert.match(html, /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="\.\/favicon\.svg"\s*\/>/);
  assert.match(html, /<link\s+rel="apple-touch-icon"\s+sizes="180x180"\s+href="\.\/apple-touch-icon\.png"\s*\/>/);
  assert.match(html, /<link\s+rel="manifest"\s+href="\.\/manifest\.webmanifest"\s*\/>/);

  // Accessible viewport (must allow user scaling for Lighthouse a11y & WCAG 200% zoom)
  assert.match(html, /<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1\.0"\s*\/>/);
  assert.doesNotMatch(html, /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(html, /maximum-scale\s*=\s*1(\.0)?/i);
});
