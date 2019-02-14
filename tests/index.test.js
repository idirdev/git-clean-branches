/**
 * @file tests/index.test.js
 * @description Tests for git-clean-branches
 * @author idirdev
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const {
  PROTECTED_DEFAULTS,
  getProtectedBranches,
  getCurrentBranch,
  findMergedBranches,
  findStaleBranches,
  deleteBranch,
  getBranchAge,
  summary,
} = require('../src/index.js');

/**
 * Creates a temp git repo with an initial commit.
 *
 * @returns {string} Path to the repo.
 */
function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gcb-test-'));
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
  fs.writeFileSync(path.join(dir, 'file.txt'), 'init');
  execSync('git add .', { cwd: dir, stdio: 'pipe' });
  execSync('git commit -m "initial"', { cwd: dir, stdio: 'pipe' });
  return dir;
}

test('PROTECTED_DEFAULTS contains main, master, develop, release', () => {
  assert.ok(PROTECTED_DEFAULTS.includes('main'));
  assert.ok(PROTECTED_DEFAULTS.includes('master'));
  assert.ok(PROTECTED_DEFAULTS.includes('develop'));
  assert.ok(PROTECTED_DEFAULTS.includes('release'));
});

test('getCurrentBranch returns a non-empty string', () => {
  const dir = makeTempRepo();
  const branch = getCurrentBranch(dir);
  assert.equal(typeof branch, 'string');
  assert.ok(branch.length > 0);
});

test('getProtectedBranches includes PROTECTED_DEFAULTS and current branch', () => {
  const dir = makeTempRepo();
  const current = getCurrentBranch(dir);
  const protected_ = getProtectedBranches([], dir);
  assert.ok(protected_.includes(current));
  assert.ok(protected_.includes('main'));
});

test('findMergedBranches returns array', () => {
  const dir = makeTempRepo();
  const result = findMergedBranches({ dir });
  assert.ok(Array.isArray(result));
});

test('findMergedBranches excludes protected branches', () => {
  const dir = makeTempRepo();
  const result = findMergedBranches({ dir });
  for (const b of result) {
    assert.ok(!PROTECTED_DEFAULTS.includes(b), `${b} should be protected`);
  }
});

test('findMergedBranches finds a merged branch', () => {
  const dir = makeTempRepo();
  execSync('git checkout -b feature/test', { cwd: dir, stdio: 'pipe' });
  fs.writeFileSync(path.join(dir, 'feat.txt'), 'feat');
  execSync('git add .', { cwd: dir, stdio: 'pipe' });
  execSync('git commit -m "feature"', { cwd: dir, stdio: 'pipe' });
  // Get the default branch name (could be main or master)
  const defaultBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: dir, encoding: 'utf8' }).trim();
  // Switch back to initial branch and merge
  execSync('git checkout -', { cwd: dir, stdio: 'pipe' });
  execSync('git merge feature/test', { cwd: dir, stdio: 'pipe' });
  const merged = findMergedBranches({ dir });
  assert.ok(merged.includes('feature/test'), 'feature/test should be in merged list');
});

test('getBranchAge returns a number', () => {
  const dir = makeTempRepo();
  const branch = getCurrentBranch(dir);
  const age = getBranchAge(branch, dir);
  assert.equal(typeof age, 'number');
});

test('getBranchAge returns Infinity for unknown branch', () => {
  const dir = makeTempRepo();
  const age = getBranchAge('nonexistent-branch-xyz', dir);
  assert.equal(age, Infinity);
});

test('findStaleBranches returns array', () => {
  const dir = makeTempRepo();
  const result = findStaleBranches(30, { dir });
  assert.ok(Array.isArray(result));
});

test('summary with empty array returns fallback message', () => {
  const msg = summary([]);
  assert.equal(msg, 'No branches to clean up.');
});

test('summary lists branch names', () => {
  const msg = summary([{ name: 'feature/old' }, { name: 'fix/stale' }]);
  assert.ok(msg.includes('feature/old'));
  assert.ok(msg.includes('fix/stale'));
});
