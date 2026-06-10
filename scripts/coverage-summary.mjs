/* global console, process */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

const summaryFiles = {
  backend: path.join(rootDir, 'apps/api/coverage/coverage-summary.json'),
  frontend: path.join(rootDir, 'apps/web/coverage/coverage-summary.json'),
};

const readSummary = (label, filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing coverage summary for ${label}: ${filePath}`);
  }

  const summary = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return summary.total;
};

const formatPercentage = (value) => `${value.toFixed(2)}%`;

const printSection = (label, total) => {
  console.log(`\n${label}`);
  console.log(`  Lines:      ${formatPercentage(total.lines.pct)}`);
  console.log(`  Statements: ${formatPercentage(total.statements.pct)}`);
  console.log(`  Functions:  ${formatPercentage(total.functions.pct)}`);
  console.log(`  Branches:   ${formatPercentage(total.branches.pct)}`);
};

const aggregateMetric = (metricName, summaries) => {
  const covered = summaries.reduce(
    (sum, summary) => sum + summary[metricName].covered,
    0,
  );
  const total = summaries.reduce(
    (sum, summary) => sum + summary[metricName].total,
    0,
  );

  return {
    covered,
    total,
    pct: total === 0 ? 100 : (covered / total) * 100,
  };
};

const backend = readSummary('backend', summaryFiles.backend);
const frontend = readSummary('frontend', summaryFiles.frontend);
const overall = {
  lines: aggregateMetric('lines', [backend, frontend]),
  statements: aggregateMetric('statements', [backend, frontend]),
  functions: aggregateMetric('functions', [backend, frontend]),
  branches: aggregateMetric('branches', [backend, frontend]),
};

console.log('\nCoverage summary');
printSection('Backend', backend);
printSection('Frontend', frontend);
printSection('Overall', overall);
