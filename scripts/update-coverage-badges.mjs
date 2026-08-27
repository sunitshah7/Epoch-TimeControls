// Regenerates the coverage badges block in README.md from the
// Vitest/v8 coverage-summary.json produced by `npm run test:coverage`.
// Self-contained (shields.io just renders a static image from numbers we
// supply in the URL) — no third-party coverage service or token needed.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const summaryPath = path.join(rootDir, 'coverage', 'coverage-summary.json');
const readmePath = path.join(rootDir, 'README.md');

const START = '<!-- COVERAGE-BADGES:START -->';
const END = '<!-- COVERAGE-BADGES:END -->';

function colorFor(pct) {
  if (pct >= 90) return 'brightgreen';
  if (pct >= 75) return 'yellow';
  if (pct >= 50) return 'orange';
  return 'red';
}

function badge(label, pct) {
  const value = `${pct}%25`; // %25 = URL-encoded '%'
  return `![${label} coverage](https://img.shields.io/badge/${encodeURIComponent(label)}-${value}-${colorFor(pct)})`;
}

const { total } = JSON.parse(readFileSync(summaryPath, 'utf-8'));
const badges = [
  badge('statements', total.statements.pct),
  badge('branches', total.branches.pct),
  badge('functions', total.functions.pct),
  badge('lines', total.lines.pct),
].join(' ');

const readme = readFileSync(readmePath, 'utf-8');
const startIdx = readme.indexOf(START);
const endIdx = readme.indexOf(END);
if (startIdx === -1 || endIdx === -1) {
  throw new Error(`Could not find ${START} / ${END} markers in README.md`);
}

const updated = `${readme.slice(0, startIdx + START.length)}\n${badges}\n${readme.slice(endIdx)}`;
writeFileSync(readmePath, updated);
console.log('Updated coverage badges in README.md');
