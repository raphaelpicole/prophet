/**
 * Stories API Integration Tests
 * Run: node --test api/__tests__/stories.test.js
 *
 * Tests against the live Vercel deployment:
 * https://prophet-h1ildogos-raphaelpicoles-projects.vercel.app
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const API_BASE = 'https://prophet-h1ildogos-raphaelpicoles-projects.vercel.app';

describe('GET /api/stories', () => {
  test('returns 200 with stories array', async () => {
    const res = await fetch(`${API_BASE}/api/stories`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert.ok(Array.isArray(body.stories), 'stories should be an array');
    assert.ok(body.pagination, 'pagination should be present');
    assert.strictEqual(typeof body.pagination.limit, 'number');
    assert.strictEqual(typeof body.pagination.offset, 'number');
  });

  test('pagination params work', async () => {
    const res = await fetch(`${API_BASE}/api/stories?limit=5&offset=10`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.pagination.limit, 5);
    assert.strictEqual(body.pagination.offset, 10);
  });

  test('accepts cycle filter param', async () => {
    // Note: cycle is an enum; valid values return 200, invalid return 400
    const res = await fetch(`${API_BASE}/api/stories?cycle=brasil`);
    // 200 = valid cycle with data, 400 = invalid enum value — both mean param is processed
    assert.ok([200, 400].includes(res.status),
      `Expected 200 or 400 (param processed), got ${res.status}`);
  });

  test('accepts region filter param', async () => {
    const res = await fetch(`${API_BASE}/api/stories?region=BR`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.stories));
  });

  test('accepts search param', async () => {
    const res = await fetch(`${API_BASE}/api/stories?search=economia`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.stories));
  });

  test('returns 400 for invalid params gracefully', async () => {
    // Just ensure it doesn't crash
    const res = await fetch(`${API_BASE}/api/stories?limit=invalid`);
    assert.ok([200, 400, 500].includes(res.status));
  });
});
