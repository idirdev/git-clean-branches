# git-clean-branches

> **[EN]** Clean up merged and stale git branches locally and remotely.
> **[FR]** Nettoyer les branches git fusionnees et obsoletes en local et a distance.

---

## Features / Fonctionnalites

**[EN]**
- List merged branches that can be safely deleted
- Detect stale branches (no commits for N days)
- Interactive or auto mode
- Protect main/master/develop branches
- Clean local and remote branches
- Dry-run mode to preview deletions

**[FR]**
- Lister les branches fusionnees pouvant etre supprimees
- Detecter les branches obsoletes (pas de commit depuis N jours)
- Mode interactif ou automatique
- Protection des branches main/master/develop
- Nettoyer les branches locales et distantes
- Mode dry-run pour previsualiser les suppressions

---

## Installation

```bash
npm install -g @idirdev/git-clean-branches
```

---

## CLI Usage / Utilisation CLI

```bash
# List merged branches
git-clean-branches --merged

# Clean stale branches (>30 days)
git-clean-branches --stale 30

# Dry run
git-clean-branches --merged --dry-run

# Include remote branches
git-clean-branches --merged --remote
```

### Example Output / Exemple de sortie

```
$ git-clean-branches --merged --dry-run

Merged branches (safe to delete):
  feature/auth-refactor     (merged 12 days ago)
  fix/login-bug             (merged 45 days ago)
  chore/update-deps         (merged 3 days ago)

Protected (skipped):
  main, develop

3 branches would be deleted (dry-run mode)
```

---

## API (Programmatic) / API (Programmation)

```js
const { findMergedBranches, findStaleBranches, deleteBranch } = require('git-clean-branches');

const merged = findMergedBranches({ remote: false });
// => ['feature/auth-refactor', 'fix/login-bug']

const stale = findStaleBranches({ days: 30 });
// => [{ name: 'old-feature', lastCommit: '2025-01-15', daysAgo: 60 }]
```

---

## License

MIT - idirdev
