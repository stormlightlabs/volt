# Changelog

All notable changes to VoltX will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Navigation and history API routing for client-side transitions (#6).

### Changed

- Refactored the binder and evaluator internals to reduce duplication and clarify runtime responsibilities (#3).
- Split lifecycle and SSR documentation into dedicated guides (#5).

### Fixed

- Repaired broken documentation links (#4).
- Stabilized JSR and Deno packaging by restoring CSS assets, removing redundant finalize steps, and keeping builds minified.

## [v0.4.0] - 2025-10-21

### Added

- Animation and transition directives with runtime support (#1).
- Documentation and runnable examples covering the animation and transition APIs (#2).

### Fixed

- Patched the JSR build pipeline to publish without errors.

## [v0.3.2] - 2025-10-21

### Fixed

- Removed CSS from the JSR build to avoid packaging failures.

## [v0.3.1] - 2025-10-21

### Changed

- Updated the automated build and publish workflow to streamline releases.

## [v0.3.0] - 2025-10-21

### Added

- Global state management primitives for sharing data across components.

### Changed

- Gzipped and minified production builds to reduce bundle size.
- Introduced shared utilities to eliminate duplicated binding logic.
- Hardened CI by pinning Node.js, adding test and Codecov automation, and enabling npm publishing from tags.
- Refreshed contributor documentation and project badges.

### Fixed

- Corrected demo CSS references and documentation stubs.
- Stabilized the publish workflow by fixing pnpm versioning, workflow naming, and tag-trigger configuration.

## [v0.2.0] - 2025-10-20

### Added

- Reactive attribute handling and event modifiers for richer templating ergonomics.

## [v0.1.0] - 2025-10-20

### Added

- Core reactivity primitives, binding evaluator, and automatic dependency tracking.
- Effects, actions, async lifecycle hooks, and debugging utilities.
- `volt` developer CLI, build pipeline, and sandboxed expression evaluator.
- Plugin system, control flow directives (`if`, `for`), reactive markup utilities, and SSR/HTTP helpers.
- Initial documentation set covering the runtime overview, reactivity spec, and roadmap.

[Unreleased]: https://github.com/stormlightlabs/volt/compare/v0.4.0...HEAD
[v0.4.0]: https://github.com/stormlightlabs/volt/compare/v0.3.2...v0.4.0
[v0.3.2]: https://github.com/stormlightlabs/volt/compare/v0.3.1...v0.3.2
[v0.3.1]: https://github.com/stormlightlabs/volt/compare/v0.3.0...v0.3.1
[v0.3.0]: https://github.com/stormlightlabs/volt/compare/v0.2.0...v0.3.0
[v0.2.0]: https://github.com/stormlightlabs/volt/compare/v0.1.0...v0.2.0
[v0.1.0]: https://github.com/stormlightlabs/volt/releases/tag/v0.1.0
