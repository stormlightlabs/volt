# VoltX.js

[![codecov](https://codecov.io/gh/stormlightlabs/volt/branch/main/graph/badge.svg)](https://codecov.io/gh/stormlightlabs/volt)
[![JSR](https://jsr.io/badges/@voltx/core)](https://jsr.io/@voltx/core)
![NPM Version](https://img.shields.io/npm/v/voltx.js?logo=npm)

> [!WARNING]
> VoltX.js is in active development.
>
> Breaking changes are expected until v1.0. Use in production at your own risk.

A lightweight reactive framework for declarative UIs. Build interactive applications using only HTML attributes powered by signals.

## Features

- Declarative, HTML-first reactivity via `data-volt-*` attributes
- Fine-grained signals and effects that update the DOM without a virtual DOM
- Zero runtime dependencies and a sub-15 KB gzipped core
- Built-in transport for SSE/WebSocket streams and JSON Patch updates
- Hydration-friendly rendering with SSR helpers
- Optional CSS design system and debug overlay for inspecting signal graphs

## Installation

### npm

```bash
npm install voltx.js
```

### JSR

```bash
npx jsr add @voltx/core
```

### Deno

```typescript
import { charge, signal } from "jsr:@voltx/core";
```

## Quick Start

```html
<div data-volt data-volt-state='{"count": 0}'>
  <p data-volt-text="count"></p>
  <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
</div>

<script type="module">
  import { charge } from 'voltx.js';
  charge();
</script>
```

## Plugins

- `data-volt-persist` – automatically sync state across reloads and tabs
- `data-volt-url` – keep signals in sync with query params and hashes
- `data-volt-scroll` – manage scroll restoration and anchored navigation
- `data-volt-shift` – trigger reusable keyframe animations
- `data-volt-surge` – apply enter/leave transitions with view-transition support

Plugins are opt-in and can be combined declaratively or registered programmatically via `charge({ plugins: [...] })`.

## Using CSS

Import the optional CSS framework:

```typescript
import 'voltx.js/css';
```

Or include via CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/voltx.js/dist/voltx.css">
```

## Documentation

Full documentation available at [https://stormlightlabs.github.io/volt/](https://stormlightlabs.github.io/volt/)

## Development

- `pnpm install` (at the repo root) to bootstrap the workspace
- `pnpm --filter lib dev` runs package scripts such as `build`, `test`, and `typecheck`
- `pnpm dev` spins up the playground in `lib/dev` for interactive testing

## License

MIT
