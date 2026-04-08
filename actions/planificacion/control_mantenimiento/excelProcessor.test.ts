import test from 'node:test';
import assert from 'node:assert/strict';

import { parseMaintenanceInterval } from './excelProcessor';

test('returns empty object for empty values', () => {
  assert.deepEqual(parseMaintenanceInterval(undefined), {});
  assert.deepEqual(parseMaintenanceInterval(null), {});
  assert.deepEqual(parseMaintenanceInterval(''), {});
});

test('parses numeric input as FH fallback', () => {
  assert.deepEqual(parseMaintenanceInterval(500), { fh: 500 });
});

test('parses single explicit unit', () => {
  assert.deepEqual(parseMaintenanceInterval('500 FH'), { fh: 500 });
  assert.deepEqual(parseMaintenanceInterval('24 FC'), { fc: 24 });
  assert.deepEqual(parseMaintenanceInterval('30 dias'), { days: 30 });
});

test('parses units without spaces', () => {
  assert.deepEqual(parseMaintenanceInterval('24FC'), { fc: 24 });
  assert.deepEqual(parseMaintenanceInterval('750FH'), { fh: 750 });
});

test('parses mixed intervals separated by comma', () => {
  assert.deepEqual(parseMaintenanceInterval('500 FH, 24 FC'), { fh: 500, fc: 24 });
  assert.deepEqual(parseMaintenanceInterval('500 FH, 24 FC, 30 days'), {
    fh: 500,
    fc: 24,
    days: 30,
  });
});

test('parses standard service intervals from the reference table', () => {
  assert.deepEqual(parseMaintenanceInterval('1A'), { fh: 250 });
  assert.deepEqual(parseMaintenanceInterval('2C'), { fh: 8000 });
  assert.deepEqual(parseMaintenanceInterval('SI'), { fc: 24000 });
  assert.deepEqual(parseMaintenanceInterval('8C'), { fh: 32000 });
});

test('supports mixing standard service intervals with explicit values', () => {
  assert.deepEqual(parseMaintenanceInterval('1A, 24 FC'), { fh: 250, fc: 24 });
  assert.deepEqual(parseMaintenanceInterval('SI, 500 FH'), { fc: 24000, fh: 500 });
});

test('parses localized numeric formats', () => {
  assert.deepEqual(parseMaintenanceInterval('1.000 FH, 2,5 days'), { fh: 1000, days: 2.5 });
  assert.deepEqual(parseMaintenanceInterval('1,000 FC'), { fc: 1000 });
});

test('falls back to FH when no unit is present', () => {
  assert.deepEqual(parseMaintenanceInterval('1200'), { fh: 1200 });
});

test('returns empty object for invalid content', () => {
  assert.deepEqual(parseMaintenanceInterval('sin intervalos validos'), {});
});
