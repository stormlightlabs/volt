# VoltX.js

A lightweight reactive framework for declarative UIs. Build interactive applications using only HTML attributes powered by signals.

## Features

- Declarative HTML-driven reactivity via `data-volt-*` attributes
- Signal-based state management with automatic DOM updates
- Zero dependencies, under 15 KB gzipped
- No virtual DOM, no build step required
- Server-side rendering and hydration support
- Built-in plugins for persistence, routing, and scroll management

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

## Using CSS

Import the optional CSS framework:

```typescript
import 'voltx.js/css';
```

Or include via CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/voltx.js/dist/volt.css">
```

## Documentation

Full documentation available at [your-docs-url]

## License

MIT
