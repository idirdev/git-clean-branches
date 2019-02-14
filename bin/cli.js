#!/usr/bin/env node
/**
 * @file cli.js
 * @description CLI for git-clean-branches
 * @author idirdev
 */

'use strict';

const {
  findMergedBranches,
  findStaleBranches,
  deleteBranch,
  summary,
} = require('../src/index.js');

const args = process.argv.slice(2);

function flag(name) { return args.includes(name); }
function opt(name, def) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
}

const merged = flag('--merged');
const stale = Number(opt('--stale', 0));
const remote = flag('--remote');
const dryRun = flag('--dry-run');
const extraProtect = opt('--protect', '').split(',').filter(Boolean);
const dir = process.cwd();

let branches = [];

if (merged) {
  const names = findMergedBranches({ dir, protect: extraProtect });
  branches = names.map((name) => ({ name }));
}

if (stale > 0) {
  const staleBranches = findStaleBranches(stale, { dir, protect: extraProtect });
  for (const b of staleBranches) {
    if (!branches.find((x) => x.name === b.name)) branches.push(b);
  }
}

if (branches.length === 0) {
  console.log('No branches found to clean.');
  process.exit(0);
}

console.log(summary(branches));

if (!dryRun) {
  for (const b of branches) {
    const result = deleteBranch(b.name, remote, dir);
    console.log(result.message);
  }
} else {
  console.log('\n[dry-run] No branches deleted.');
}
