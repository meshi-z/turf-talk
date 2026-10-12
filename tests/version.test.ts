import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APP_VERSION } from '../src/version.ts';

test('version: APP_VERSION conforms to semantic versioning format', () => {
  assert.ok(APP_VERSION, 'APP_VERSION should be defined');
  // vX.Y.Z または vX.Y.Z-alpha などのセマンティックバージョニング形式
  assert.match(
    APP_VERSION,
    /^v\d+\.\d+\.\d+/,
    `APP_VERSION "${APP_VERSION}" should match semantic versioning format (e.g., v0.1.5)`
  );
});

test('version: APP_VERSION matches package.json version', () => {
  const pkg = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  );
  assert.equal(
    APP_VERSION,
    `v${pkg.version}`,
    `APP_VERSION should match v + package.json version (${pkg.version})`
  );
});
