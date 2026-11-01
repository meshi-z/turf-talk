import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isDevOrLocalhost } from '../src/lib/environment.ts';

describe('environment detection (isDevOrLocalhost)', () => {
  it('returns true when isDev is true regardless of hostname', () => {
    assert.equal(isDevOrLocalhost('turftalk.example.com', true), true);
    assert.equal(isDevOrLocalhost('production.io', true), true);
  });

  it('returns true for localhost hostnames in production mode', () => {
    assert.equal(isDevOrLocalhost('localhost', false), true);
    assert.equal(isDevOrLocalhost('127.0.0.1', false), true);
    assert.equal(isDevOrLocalhost('[::1]', false), true);
    assert.equal(isDevOrLocalhost('sub.localhost', false), true);
  });

  it('returns false for external hostnames when isDev is false', () => {
    assert.equal(isDevOrLocalhost('meshi-z.github.io', false), false);
    assert.equal(isDevOrLocalhost('turf-talk.vercel.app', false), false);
    assert.equal(isDevOrLocalhost('example.com', false), false);
    assert.equal(isDevOrLocalhost('', false), false);
  });
});
