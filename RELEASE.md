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

1. Ensure all tests pass

   ```bash
   pnpm test:run
   ```

2. Type check all packages

   ```bash
   pnpm typecheck
   ```

3. Build all packages

   ```bash
   pnpm build
   ```

4. Review changelog and update version numbers

## Publishing voltx.js

The core package is published as:

- **npm**: `voltx.js` (unscoped)
- **JSR**: `@voltx.js/core` (scoped, JSR requires scopes)

### 1. Update Version

Update version in both files:

- `lib/package.json`
- `lib/jsr.json`

Use semantic versioning (semver):

- Patch: bug fixes (0.1.0 → 0.1.1)
- Minor: new features, backward compatible (0.1.0 → 0.2.0)
- Major: breaking changes (0.1.0 → 1.0.0)

### 2. Build Package

```bash
cd lib
pnpm build
```

Verify build outputs:

- `dist/volt.js` - Main framework bundle
- `dist/volt.css` - CSS framework
- `dist/index.d.ts` - TypeScript declarations

### 3. Publish to npm

```bash
cd lib
npm publish --provenance
```

The `--provenance` flag adds supply chain security metadata when publishing from GitHub Actions.

### 4. Publish to JSR

```bash
cd lib
npx jsr publish
```

First time: Browser window opens for authentication
Subsequent publishes: Uses cached credentials

### 5. Verify Publication

npm:

```bash
npm view voltx.js
```

JSR:

```bash
npx jsr info @voltx.js/core
```

Or visit:

- npm: <https://www.npmjs.com/package/voltx.js>
- JSR: <https://jsr.io/@voltx.js/core>

## Post-Release

1. Create Git tag

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. Create GitHub release with changelog

3. Update documentation if needed

## To-Do

Consider setting up GitHub Actions workflow to automate:

- Publishing to npm
- Version bumping
- Building
- Git tagging
- GitHub release creation

Consider using `bumpp` or `changeset` for automated version management across the monorepo.
