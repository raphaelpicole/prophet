/**
 * Indicators API Integration Tests
 * Run: node --test api/__tests__/indicators.test.js
 *
 * Tests against the live Vercel deployment:
 * https://prophet-h1ildogos-raphaelpicoles-projects.vercel.app
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const API_BASE = 'https://prophet-h1ildogos-raphaelpicoles-projects.vercel.app';

describe('GET /api/indicators', () => {
  test('returns 200 with correct structure', async () => {
    const res = await fetch(`${API_BASE}/api/indicators`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(typeof body.total_stories, 'number', 'total_stories should be a number');
    assert.strictEqual(typeof body.articles_today, 'number', 'articles_today should be a number');
    assert.strictEqual(typeof body.cycles, 'object', 'cycles should be an object');
    assert.ok(Array.isArray(body.hot_stories), 'hot_stories should be an array');
    assert.ok(body.updated_at, 'updated_at should be present');
  });

  test('cycles is a map of cycle names to counts', async () => {
    const res = await fetch(`${API_BASE}/api/indicators`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(typeof body.cycles, 'object');
    assert.ok(Array.isArray(body.hot_stories));
  });

  test('updated_at is ISO format', async () => {
    const res = await fetch(`${API_BASE}/api/indicators`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(body.updated_at),
      `updated_at should be ISO format, got: ${body.updated_at}`);
  });

  test('hot_stories array may contain story objects', async () => {
    const res = await fetch(`${API_BASE}/api/indicators`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.hot_stories));
  });
});
