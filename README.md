# VoltX.js

[![codecov](https://codecov.io/gh/stormlightlabs/volt/branch/main/graph/badge.svg)](https://codecov.io/gh/stormlightlabs/volt)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![JSR](https://jsr.io/badges/@voltx/core)](https://jsr.io/@voltx/core)
![NPM Version](https://img.shields.io/npm/v/voltx.js?logo=npm)
![Status - Test](https://github.com/stormlightlabs/volt/actions/workflows/test.yml/badge.svg)
![Status - Lint](https://github.com/stormlightlabs/volt/actions/workflows/lint.yml/badge.svg)

> ⚠️ **Pre-release Software**: VoltX.js remains in active development. Expect breaking changes until v1.0 and evaluate before using in production.

Volt is a monorepo centered around the VoltX.js runtime—a lightweight, declarative alternative to component-centric UI frameworks. The repo also ships the Volt CLI and the documentation site that demonstrates and explains the runtime.

## Local Development

### Packages

```sh
volt/
├── lib/   VoltX.js runtime published to npm (`voltx.js`) and JSR (`@voltx/core`)
├── dev/   VoltX dev CLI and local tooling
├── cli/   Project scaffolding and management CLI (`create-voltx`)
└── docs/  VitePress documentation site
```

### Getting Started

- Runtime usage: see [`lib/README.md`](./lib/README.md) for installation guides and quick-start examples.
- Local development: `pnpm install` then `pnpm --filter lib dev` run package-specific scripts (`build`, `test`, etc.).
    - Review [contribution](./CONTRIBUTING.md) guidelines
- Documentation: `pnpm docs:dev` launches the VitePress site.

### Working on New Features

The `lib/` package includes a comprehensive demo Vite app showcasing all VoltX.js features:

```sh
# Start the demo development server
pnpm --filter voltx.js dev
```

The demo app essentially provides an interactive sandbox to develop and catch bugs in new implementations.

#### Pages

- **Home**: Framework overview and quick start examples
- **CSS**: VoltX.css typography, layout, and component features
- **Interactivity**: Dialogs, buttons, event handling
- **Forms**: Two-way binding and form validation patterns
- **Reactivity**: Signals, computed values, conditional/list rendering
- **Plugins**: Persistence, scroll management, URL sync
- **Animations**: Transitions and keyframe animations

Docs are the source of truth but take advantage of this environment. When developing new features, add examples to the appropriate demo section or create a new page to showcase the functionality.

## License

[MIT License](./lib/LICENSE) © 2025 Stormlight Labs
