# Volt Plugin System Spec

## Overview

The plugin system enables extending the framework with custom `data-x-*` attribute bindings.

Plugins follow the same binding patterns as core bindings (text, html, class, events) but can implement specialized behaviors like persistence, scrolling, and URL synchronization.

## Design Goals

### Extensibility

Plugins can access the full binding context including the DOM element, reactive scope, signal utilities, and cleanup registration.

### Explicit Opt-In

Built-in plugins require explicit registration to keep the core bundle minimal. Applications only load the functionality they use.

### Simplicity

Plugin API mirrors the internal binding handler signature. Developers who end up familiar with Volt internals can easily create plugins.

### Consistency

Plugins should integrate seamlessly with the mount/unmount lifecycle, cleanup system, and reactive primitives.

## Plugin API

### Registration

Plugins are registered using the `registerPlugin()` function:

```ts
registerPlugin(name: string, handler: PluginHandler): void
```

The plugin name becomes the `data-x-*` attribute suffix. For example, registering a plugin named `"tooltip"` enables `data-x-tooltip` attributes.

### Plugin Handler

Plugin handlers receive a context object and the attribute value:

```ts
type PluginHandler = (context: PluginContext, value: string) => void
```

The handler should:

1. Parse the attribute value
2. Set up bindings and subscriptions
3. Register cleanup functions for unmount

### PluginContext

The context object provides:

```ts
interface PluginContext {
  element: Element;                              // The bound DOM element
  scope: Scope;                                  // Reactive scope with signals
  addCleanup(fn: CleanupFunction): void;        // Register cleanup
  findSignal(path: string): Signal | undefined; // Locate signals by path
  evaluate(expression: string): unknown;        // Evaluate expressions
}
```

### Example: Custom Tooltip Plugin

```ts
import { registerPlugin } from 'volt';

registerPlugin('tooltip', (context, value) => {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = context.evaluate(value);

  const show = () => document.body.appendChild(tooltip);
  const hide = () => tooltip.remove();

  context.element.addEventListener('mouseenter', show);
  context.element.addEventListener('mouseleave', hide);

  context.addCleanup(() => {
    hide();
    context.element.removeEventListener('mouseenter', show);
    context.element.removeEventListener('mouseleave', hide);
  });

  const signal = context.findSignal(value);
  if (signal) {
    const unsubscribe = signal.subscribe((newValue) => {
      tooltip.textContent = String(newValue);
    });
    context.addCleanup(unsubscribe);
  }
});
```

## Built-in Plugins

Volt.js ships with three built-in plugins that must be explicitly registered.

### data-x-persist

Synchronizes signal values with persistent storage (`localStorage`, `sessionStorage`, `IndexedDB`).

**Syntax:**

```html
<input data-x-persist="signalName:storageType" />
```

**Storage Types:**

- `local` - localStorage (persistent across sessions)
- `session` - sessionStorage (cleared on tab close)
- `indexeddb` - IndexedDB (large datasets, async)
- Custom adapters via `registerStorageAdapter()`

**Behavior:**

1. On mount: Load persisted value into signal (if exists)
2. On signal change: Persist new value to storage
3. On unmount: Clean up storage listeners

**Examples:**

```html
<!-- Persist counter to localStorage -->
<div data-x-text="count" data-x-persist="count:local"></div>

<!-- Persist form state to sessionStorage -->
<input data-x-on-input="updateForm" data-x-persist="formData:session" />

<!-- Persist large dataset to IndexedDB -->
<div data-x-persist="userData:indexeddb"></div>
```

**Custom Storage Adapters:**

```ts
interface StorageAdapter {
  get(key: string): Promise<unknown> | unknown;
  set(key: string, value: unknown): Promise<void> | void;
  remove(key: string): Promise<void> | void;
}

registerStorageAdapter('custom', {
  async get(key) { /* ... */ },
  async set(key, value) { /* ... */ },
  async remove(key) { /* ... */ }
});
```

### data-x-scroll

Manages scroll behavior including position restoration, programmatic scrolling, scroll spy, and smooth scrolling.

**Syntax:**

```html
<!-- Scroll position restoration -->
<div data-x-scroll="restore:position"></div>

<!-- Scroll to element when signal changes -->
<div data-x-scroll="scrollTo:targetId"></div>

<!-- Scroll spy (updates signal when in viewport) -->
<div data-x-scroll="spy:isVisible"></div>

<!-- Smooth scroll behavior -->
<div data-x-scroll="smooth:true"></div>
```

**Behaviors:**

**Position Restoration:**

```html
<div id="content" data-x-scroll="restore:scrollPos">
  <!-- scroll position saved on scroll, restored on mount -->
</div>
```

Saves scroll position to the specified signal and restores on mount.

**Scroll-To:**

```html
<button data-x-on-click="scrollToSection.set('section2')">Go to Section 2</button>
<div id="section2" data-x-scroll="scrollTo:scrollToSection"></div>
```

Scrolls to element when the specified signal changes to match element's ID or selector.

**Scroll Spy:**

```html
<nav>
  <a data-x-class="{ active: section1Visible }">Section 1</a>
  <a data-x-class="{ active: section2Visible }">Section 2</a>
</nav>
<div data-x-scroll="spy:section1Visible"></div>
<div data-x-scroll="spy:section2Visible"></div>
```

Updates signal with boolean visibility state using Intersection Observer.

**Smooth Scrolling:**

```html
<div data-x-scroll="smooth:behavior"></div>
```

Enables smooth scrolling with configurable behavior from signal.

### data-x-url

Synchronizes signal values with URL parameters and hash-based routing.

**Syntax:**

```html
<!-- One-way: Read URL param into signal on mount -->
<input data-x-url="read:searchQuery" />

<!-- Bidirectional: Keep URL and signal in sync -->
<input data-x-url="sync:filter" />

<!-- Hash-based routing -->
<div data-x-url="hash:currentRoute"></div>
```

**Behaviors:**

**Read URL Parameters:**

```html
<!-- Initialize signal from ?tab=profile -->
<div data-x-url="read:tab"></div>
```

Reads URL parameter on mount and sets signal value. Signal changes do not update URL.

**Bidirectional Sync:**

```html
<!-- Keep ?search=query in sync with searchQuery signal -->
<input data-x-on-input="handleSearch" data-x-url="sync:searchQuery" />
```

Changes to signal update URL parameter, changes to URL update signal. Uses History API for clean URLs.

**Hash Routing:**

```html
<!-- Sync with #/page/about -->
<div data-x-url="hash:route"></div>
<div data-x-text="route === '/page/about' ? 'About Page' : 'Home'"></div>
```

Keeps hash portion of URL in sync with signal. Useful for client-side routing.

**Notes:**

- Uses History API (`pushState`/`replaceState`) for param sync
- Listens to `popstate` for browser back/forward
- Debounces URL updates to avoid excessive history entries
- Automatically serializes/deserializes values (strings, numbers, booleans)

## Implementation

### Integration

The binder system checks the plugin registry before falling through to unknown attribute warnings

### Context

The binder creates a PluginContext from BindingContext:

```ts
function createPluginContext(bindingContext: BindingContext): PluginContext {
  return {
    element: bindingContext.element,
    scope: bindingContext.scope,
    addCleanup: (fn) => bindingContext.cleanups.push(fn),
    findSignal: (path) => findSignalInScope(bindingContext.scope, path),
    evaluate: (expr) => evaluate(expr, bindingContext.scope)
  };
}
```

### Module Structure

```sh
src/
  core/
    plugin.ts       # Plugin registry and API
    binder.ts       # Modified to integrate plugins
  plugins/
    persist.ts      # Persistence plugin
    scroll.ts       # Scroll behavior plugin
    url.ts          # URL synchronization plugin
  index.ts          # Exports registerPlugin and built-in plugins
```

## Bundle Size Considerations

With explicit registration, applications control their bundle size:

- Core framework: ~15 KB gzipped (no plugins)
- Each plugin: ~1-3 KB gzipped
- Applications import only what they use
- Tree-shaking eliminates unused plugins

Example bundle breakdown:

```sh
volt/core         : 15 KB
volt/plugins/persist  : 2 KB
volt/plugins/scroll   : 2.5 KB
volt/plugins/url      : 1.5 KB
--------------------------------
Total (all plugins)   : 21 KB
```

## Extension Points

Future plugin capabilities:

- Lifecycle hooks (beforeMount, afterMount, beforeUnmount)
- Plugin dependencies and composition
- Plugin configuration API
- Async plugin initialization
- Plugin registry
