# Rolly Froggy Bicycle Website

A Vite + React Three Fiber playground for the Rolly/Froggy bicycle world.

## Development

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
```

The production build is written to `dist/`.

## GitHub Pages deployment

This site deploys automatically from the `main` branch through the GitHub Actions workflow at `.github/workflows/deploy.yml`.

The workflow uses GitHub's first-party Pages actions:

1. install dependencies with `npm ci`
2. build the Vite app with `npm run build`
3. upload `dist/` as a Pages artifact
4. deploy that artifact to the `github-pages` environment

If auto-deploying stops, check these repository settings:

1. Go to **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Confirm Actions are enabled under **Settings → Actions → General**.
4. Push or merge to `main`, or run **Deploy website** manually from the Actions tab.

## Handling a problematic pull request

If the last PR was created from an older prompt and now conflicts with the current code, you have two safe options.

### Option 1: close the bad PR and replace it

Use this when the PR is easier to discard than repair.

1. Open the PR on GitHub.
2. Add a comment like: `Closing because this was based on an older prompt and conflicts with the current version. Replacing with a fresh PR from main.`
3. Click **Close pull request**.
4. Create a new branch from the latest `main` and re-apply only the changes you still want.

With GitHub CLI:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c replacement-branch
# make the corrected changes
git push -u origin replacement-branch
gh pr close <PR_NUMBER> --comment "Closing because this was based on an older prompt and conflicts with the current version. Replacing with a fresh PR from main."
gh pr create --base main --head replacement-branch --title "Replace conflicted update" --body "Rebuilds the change from current main."
```

### Option 2: fix the existing PR branch

Use this when the PR contains useful commits you want to keep.

```bash
git fetch origin
git switch <PR_BRANCH>
git rebase origin/main
# resolve conflicts in your editor
git add <resolved-files>
git rebase --continue
npm run build
git push --force-with-lease
```

`--force-with-lease` is safer than `--force` because it refuses to overwrite someone else's newer work on the same branch.
