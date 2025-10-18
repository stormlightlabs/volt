---
outline: deep
---

# Framework Overview

Volt.js is a lightweight, hypermedia based reactive framework for building declarative UIs.

It combines HTML-driven behavior via `data-x-*` attributes with signal-based reactivity.

## Architecture

The framework consists of three layers:

### Reactivity Layer

Signals are the foundation of Volt's reactive system:

```js
import { signal, computed, effect } from 'volt';

const count = signal(0);
const doubled = computed(() => count.get() * 2, [count]);

effect(() => console.log('Count:', count.get()), [count]);
```

- **`signal()`** creates mutable reactive state
- **`computed()`** derives values from signals
- **`effect()`** runs side effects when dependencies change

No reactivity scheduler. Signals notify subscribers directly on change.

### Binding System

Bindings connect signals to DOM via `data-x-*` attributes:

```html
<div id="app">
  <p data-x-text="count">0</p>
  <button data-x-on-click="increment">+</button>
  <div data-x-if="isPositive">Positive</div>
</div>
```

```js
mount(document.querySelector('#app'), {
  count,
  isPositive,
  increment: () => count.set(count.get() + 1)
});
```

Core bindings:

- `data-x-text` - Update text content
- `data-x-html` - Update HTML content
- `data-x-class` - Toggle CSS classes
- `data-x-on-*` - Attach event handlers
- `data-x-if` - Conditional rendering
- `data-x-for` - List rendering

### Plugin System

Extend functionality via custom `data-x-*` bindings:

```js
import { registerPlugin } from 'volt';

registerPlugin('tooltip', (context, value) => {
  // Custom binding logic
});
```

See [Plugin Spec](./plugin-spec.md) for details.

## Key Concepts

### Signals Update DOM Directly

Bindings subscribe to signals and update the real DOM when values change.

### HTML Drives Behavior

Declare UI structure and interactivity in HTML. JavaScript provides state and handlers.

### Explicit Dependencies

Computed signals and effects declare dependencies explicitly:

```js
computed(() => a.get() + b.get(), [a, b])  // Both deps listed
```

### Cleanup Management

`mount()` returns a cleanup function. All bindings register their cleanup to prevent memory leaks:

```js
const cleanup = mount(element, scope);
// Later:
cleanup();  // Unsubscribes all bindings
```

## Examples

### Counter

Simple counter demonstrating basic reactivity:

- Location: `examples/counter/`
- Shows: signals, computed values, conditional rendering, class bindings

### TodoMVC

Complete todo app with filtering and editing:

- Location: `examples/todomvc/`
- Shows: list rendering, event handling, computed filters, state mapping
- Uses: Volt CSS (classless framework) for styling

## Design Constraints

- Core runtime under 15 KB gzipped
- Zero dependencies
- No custom build systems
- TypeScript source
- Every feature tested

## Browser Support

Modern browsers with support for:

- ES modules
- Proxy objects
- CSS custom properties

Chrome 90+, Firefox 88+, Safari 14+
