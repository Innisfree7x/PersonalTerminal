import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const DEFAULT_THRESHOLD = 0.02;
const REPORT_PATH = process.env.BLOCKER_E2E_JSON_REPORT || '.tmp/reports/blocker-e2e-report.json';

function parseThreshold(rawValue) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_THRESHOLD;
  return parsed;
}

function collectTestsFromSuites(suites, collected = []) {
  for (const suite of suites || []) {
    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        if (Array.isArray(spec.tests)) {
          for (const test of spec.tests) {
            collected.push({
              title: spec.title || test.title || 'unknown-test',
              results: Array.isArray(test.results) ? test.results : [],
              status: typeof test.status === 'string' ? test.status : 'unknown',
            });
          }
        }
      }
    }
    collectTestsFromSuites(suite.suites, collected);
  }
  return collected;
}

function summarizeFlakeMetrics(reportJson) {
  const tests = collectTestsFromSuites(reportJson.suites);

  let total = 0;
  let passed = 0;
  let skipped = 0;
  let failed = 0;
  let flaky = 0;

  for (const test of tests) {
    const statuses = test.results.map((result) => result.status).filter(Boolean);
    const finalStatus =
      statuses.length > 0 ? statuses[statuses.length - 1] : test.status || 'unknown';
    const hadFailedAttempt = statuses.some((status) =>
      ['failed', 'timedOut', 'interrupted'].includes(status)
    );

    if (finalStatus === 'skipped') {
      skipped += 1;
      continue;
    }

    total += 1;

    if (finalStatus === 'passed') {
      passed += 1;
      if (hadFailedAttempt) {
        flaky += 1;
      }
      continue;
    }

    failed += 1;
  }

  const flakeRate = total > 0 ? flaky / total : 0;
  return {
    total,
    passed,
    failed,
    skipped,
    flaky,
    flakeRate,
  };
}

function ensureParentDir(pathname) {
  mkdirSync(dirname(pathname), { recursive: true });
}

function main() {
  const threshold = parseThreshold(process.env.E2E_BLOCKER_FLAKE_THRESHOLD ?? DEFAULT_THRESHOLD);
  const reportPathAbs = resolve(process.cwd(), REPORT_PATH);
  ensureParentDir(reportPathAbs);

  const run = spawnSync(
    'npx',
    ['playwright', 'test', 'tests/e2e/blocker', '--workers=1', '--reporter=json'],
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 50,
      env: process.env,
    }
  );

  if (run.stderr) {
    process.stderr.write(run.stderr);
  }

  const stdout = run.stdout || '';
  writeFileSync(reportPathAbs, stdout);

  let reportJson;
  try {
    reportJson = JSON.parse(stdout);
  } catch (error) {
    console.error('[flake-gate] Failed to parse Playwright JSON report.');
    console.error(`[flake-gate] Report file: ${reportPathAbs}`);
    process.exit(run.status || 1);
  }

  const summary = summarizeFlakeMetrics(reportJson);
  const flakePct = (summary.flakeRate * 100).toFixed(2);
  const thresholdPct = (threshold * 100).toFixed(2);

  console.log(
    `[flake-gate] total=${summary.total}, passed=${summary.passed}, failed=${summary.failed}, skipped=${summary.skipped}, flaky=${summary.flaky}`
  );
  console.log(`[flake-gate] flake_rate=${flakePct}% (threshold=${thresholdPct}%)`);
  console.log(`[flake-gate] report=${reportPathAbs}`);

  if (process.env.CI && summary.total === 0) {
    console.error('[flake-gate] No executed blocker tests in CI. Failing run.');
    process.exit(1);
  }

  if (run.status !== 0) {
    if (!process.env.CI && summary.total === 0 && summary.failed === 0) {
      console.log('[flake-gate] Playwright returned non-zero with zero executed tests (local mode).');
      process.exit(0);
    }
    process.exit(run.status || 1);
  }

  if (summary.flakeRate > threshold) {
    console.error('[flake-gate] Flake rate exceeds threshold.');
    process.exit(1);
  }

  process.exit(0);
}

main();
