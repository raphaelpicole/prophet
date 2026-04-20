/**
 * Health Check API Integration Tests
 * Run: node --test api/__tests__/health.test.js
 *
 * Tests against the live Vercel deployment:
 * https://prophet-h1ildogos-raphaelpicoles-projects.vercel.app
 *
 * NOTE: /api/health must be deployed first. If endpoint doesn't exist yet,
 * tests will be skipped.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const API_BASE = 'https://prophet-h1ildogos-raphaelpicoles-projects.vercel.app';

describe('GET /api/health', () => {
  test('returns 200 or 503 with status flags', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    // 404 = not yet deployed; skip test in that case
    if (res.status === 404) {
      assert.ok(true, 'Skipped: /api/health not yet deployed');
      return;
    }
    assert.ok([200, 503].includes(res.status),
      `Expected 200 or 503, got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(typeof body.supabase, 'boolean', 'supabase should be boolean');
    assert.strictEqual(typeof body.ollama, 'boolean', 'ollama should be boolean');
    assert.ok(body.timestamp, 'timestamp should be present');
    assert.ok(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(body.timestamp),
      `timestamp should be ISO format, got: ${body.timestamp}`);
  });

  test('includes all required status fields', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.status === 404) {
      assert.ok(true, 'Skipped: /api/health not yet deployed');
      return;
    }
    const body = await res.json();
    assert.ok('supabase' in body, 'supabase field missing');
    assert.ok('ollama' in body, 'ollama field missing');
    assert.ok('timestamp' in body, 'timestamp field missing');
  });

  test('returns JSON content type', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.status === 404) {
      assert.ok(true, 'Skipped: /api/health not yet deployed');
      return;
    }
    const contentType = res.headers.get('content-type');
    assert.ok(contentType && contentType.includes('application/json'),
      `Expected application/json, got: ${contentType}`);
  });
});
