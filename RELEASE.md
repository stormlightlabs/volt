# Release Guide

This guide covers the process for publishing Volt.js packages to npm and JSR.

## Prerequisites

### npm

Ensure you have npm publishing rights:

```bash
npm whoami
```

Make sure you're logged in:

```bash
npm login
```

### JSR

No setup required. JSR authentication happens via browser during first publish.

## Pre-Release Checklist

- [ ] Ensure all tests pass

```bash
pnpm test:run
```

- [ ] Type check all packages

```bash
pnpm typecheck
```

- [ ] Build all packages

```bash
pnpm build
```

- [ ] Update version numbers

## Publishing voltx.js

The core package is published as:

- **npm**: `voltx.js` (unscoped)
- **JSR**: `@voltx.js/core` (scoped, JSR requires scopes)

Publishing is **fully automated** via GitHub Actions when you push a tag.

### 1. Update Version

Update version in both files:

- `lib/package.json`
- `lib/jsr.json`

Use semantic versioning (semver):

- Patch: bug fixes (0.1.0 → 0.1.1)
- Minor: new features, backward compatible (0.1.0 → 0.2.0)
- Major: breaking changes (0.1.0 → 1.0.0)

### 2. Build and Test Locally

```bash
cd lib
pnpm build
pnpm test:run
```

Verify build outputs:

- [ ] `dist/voltx.js` - Unminified ES module
- [ ] `dist/voltx.min.js` - Minified ES module
- [ ] `dist/voltx.min.js.gz` - Gzipped minified version (for size verification)
- [ ] `dist/voltx.d.ts` - Main TypeScript declarations
- [ ] `dist/debug.js` - Debug module (unminified)
- [ ] `dist/debug.min.js` - Debug module (minified)
- [ ] `dist/debug.d.ts` - Debug TypeScript declarations
- [ ] `dist/voltx.css` - Unminified CSS framework
- [ ] `dist/voltx.min.css` - Minified CSS framework

Ensure no unwanted files:

- [ ] No chunks (code splitting disabled)
- [ ] No asset files (vite.svg, etc.)

### 3. Commit Version Bump

```bash
git add lib/package.json lib/jsr.json
git commit -m "chore: bump version to vX.Y.Z"
git push origin main
```

### 4. Create and Push Tag

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

**This triggers automated publishing:**

- `.github/workflows/publish-npm.yml` - Publishes to npm with provenance
- `.github/workflows/publish-jsr.yml` - Publishes to JSR

### 5. Monitor GitHub Actions

- [ ] Check workflow runs: <https://github.com/stormlightlabs/volt/actions>
- [ ] Verify npm publish workflow succeeded
- [ ] Verify JSR publish workflow succeeded

### 6. Verify Publication

- [ ] Verify npm publication

```bash
npm view voltx.js
```

Visit: <https://www.npmjs.com/package/voltx.js>

- [ ] Verify JSR publication

```bash
npx jsr info @voltx.js/core
```

Visit: <https://jsr.io/@voltx.js/core>

- [ ] Verify unpkg.com distribution structure
Visit: `https://unpkg.com/voltx.js@VERSION/` (replace VERSION)

You should see:
      - dist/ directory with all build outputs
      - LICENSE
      - README.md
      - package.json

## Post-Release

- [ ] Create GitHub release with changelog
      - Go to <https://github.com/stormlightlabs/volt/releases>
      - Click "Draft a new release"
      - Select the tag (vX.Y.Z) that was just pushed
      - Add release notes and changelog
- [ ] Update documentation if needed
- [ ] Announce release (if significant update)

## Manual Publishing (Fallback)

If GitHub Actions fail or you need to publish manually:

### npm

```bash
cd lib
npm publish --provenance
```

Requires:

- npm login (`npm whoami` to verify)
- npm publish rights to voltx.js package

### JSR

```bash
cd lib
npx jsr publish
```

First time: Browser window opens for authentication
Subsequent publishes: Uses cached credentials

## To-Do

- Consider using `bumpp` or `changeset` for automated version management across the monorepo.
- Write a changelog
