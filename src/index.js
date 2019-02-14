/**
 * @file index.js
 * @description Git clean branches — find and remove merged/stale branches
 * @author idirdev
 * @module git-clean-branches
 */

'use strict';

const { execSync } = require('child_process');

/**
 * Branches that are protected by default.
 * @constant {string[]}
 */
const PROTECTED_DEFAULTS = ['main', 'master', 'develop', 'release'];

/**
 * Executes a git command and returns trimmed stdout, or empty string on failure.
 *
 * @param {string} cmd
 * @param {string} cwd
 * @returns {string}
 */
function gitCmd(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

/**
 * Returns the current branch name.
 *
 * @param {string} [dir='.']
 * @returns {string}
 */
function getCurrentBranch(dir = '.') {
  return gitCmd('git rev-parse --abbrev-ref HEAD', dir);
}

/**
 * Returns the resolved list of protected branch names.
 * Always includes PROTECTED_DEFAULTS plus the current branch.
 *
 * @param {string[]} [extra=[]] Additional branches to protect.
 * @param {string}   [dir='.']  Repo directory.
 * @returns {string[]}
 */
function getProtectedBranches(extra = [], dir = '.') {
  const current = getCurrentBranch(dir);
  return [...new Set([...PROTECTED_DEFAULTS, ...extra, current])];
}

/**
 * Returns branches that are fully merged into the current HEAD.
 * Protected branches are excluded from the result.
 *
 * @param {Object}   [opts={}]
 * @param {string}   [opts.dir='.']        Repo directory.
 * @param {string[]} [opts.protect=[]]     Extra branches to protect.
 * @returns {string[]} Array of merged branch names.
 */
function findMergedBranches(opts = {}) {
  const dir = opts.dir || '.';
  const extraProtect = opts.protect || [];
  const protected_ = getProtectedBranches(extraProtect, dir);

  const raw = gitCmd('git branch --merged', dir);
  if (!raw) return [];

  return raw
    .split('\n')
    .map((b) => b.replace(/^\*?\s+/, '').trim())
    .filter(Boolean)
    .filter((b) => !protected_.includes(b));
}

/**
 * Returns the age in days of the last commit on a branch.
 *
 * @param {string} name  Branch name.
 * @param {string} [dir='.']
 * @returns {number} Age in fractional days, or Infinity if unavailable.
 */
function getBranchAge(name, dir = '.') {
  const raw = gitCmd(`git log -1 --format=%ct "${name}"`, dir);
  if (!raw) return Infinity;
  const ts = parseInt(raw, 10);
  if (isNaN(ts)) return Infinity;
  return (Date.now() / 1000 - ts) / 86400;
}

/**
 * Returns branches whose last commit is older than the given threshold.
 * Protected branches are excluded.
 *
 * @param {number}   [days=30]           Age threshold in days.
 * @param {Object}   [opts={}]
 * @param {string}   [opts.dir='.']
 * @param {string[]} [opts.protect=[]]
 * @returns {{ name: string, ageDays: number }[]}
 */
function findStaleBranches(days = 30, opts = {}) {
  const dir = opts.dir || '.';
  const extraProtect = opts.protect || [];
  const protected_ = getProtectedBranches(extraProtect, dir);

  const raw = gitCmd('git branch', dir);
  if (!raw) return [];

  const branches = raw
    .split('\n')
    .map((b) => b.replace(/^\*?\s+/, '').trim())
    .filter(Boolean)
    .filter((b) => !protected_.includes(b));

  return branches
    .map((name) => ({ name, ageDays: getBranchAge(name, dir) }))
    .filter((b) => b.ageDays >= days);
}

/**
 * Deletes a local (and optionally remote) branch.
 *
 * @param {string}  name          Branch name.
 * @param {boolean} [remote=false] If true, also deletes the remote tracking branch.
 * @param {string}  [dir='.']
 * @returns {{ success: boolean, message: string }}
 */
function deleteBranch(name, remote = false, dir = '.') {
  try {
    execSync(`git branch -d "${name}"`, { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] });
    if (remote) {
      execSync(`git push origin --delete "${name}"`, { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] });
    }
    return { success: true, message: `Deleted branch: ${name}` };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Builds a human-readable summary of branches.
 *
 * @param {{ name: string, ageDays?: number }[]} branches
 * @returns {string}
 */
function summary(branches) {
  if (branches.length === 0) return 'No branches to clean up.';
  const lines = [`Found ${branches.length} branch(es):\n`];
  for (const b of branches) {
    const age = b.ageDays != null ? `  (${Math.round(b.ageDays)}d old)` : '';
    lines.push(`  - ${b.name}${age}`);
  }
  return lines.join('\n');
}

module.exports = {
  PROTECTED_DEFAULTS,
  getProtectedBranches,
  getCurrentBranch,
  findMergedBranches,
  findStaleBranches,
  deleteBranch,
  getBranchAge,
  summary,
};
