---
outline: deep
---

# URL Plugin

The url plugin bridges VoltXsignals with the browser’s address bar. Use it to hydrate page state from query parameters, mirror form inputs into the URL, or power hash/history based routing.

## Quick Start

```html
<!-- Populate a signal on mount -->
<div data-volt-url="read:filters.category"></div>

<!-- Two-way sync between location.search and a signal -->
<input name="q" data-volt-url="sync:searchQuery" />
```

Each binding follows `mode:signalPath[:basePath]`. The plugin resolves the signal via `ctx.findSignal` and wires it to one of the strategies below.

## Modes

### `read`

One-way hydration. On mount the plugin reads `?signalPath=value` and assigns it to the signal. Later signal updates do not modify the URL.

```html
<div data-volt-url="read:filters.status"></div>
```

### `sync`

Bidirectional query-string sync. The plugin:

1. Seeds the signal from `?signalPath=...`.
2. Subscribes to the signal and pushes URL updates (debounced) via `history.pushState`.
3. Listens for `popstate` to keep the signal in sync when the user navigates back/forward.

The `serializeValue`/`deserializeValue` helpers support strings, numbers, booleans, JSON payloads, and empty values.

```html
<input placeholder="Search…" data-volt-url="sync:search" />
```

When the input changes the URL updates to `?search=...`. Clearing the input removes the parameter.

### `hash`

Two-way binding to `window.location.hash`. Useful for simple client-side routing or tab selection:

```html
<nav data-volt-url="hash:activeTab"></nav>
```

- Updates to the signal call `history.pushState` with the new hash.
- `hashchange` events hydrate the signal when users edit the URL manually.

### `history`

Full routing synchronization with `pathname + search`. Optionally trim a base path when syncing:

```html
<main data-volt-url="history:route:/app"></main>
```

- The signal receives `/` when the user is at `/app`.
- Pushing a new value updates the URL and dispatches `volt:navigate`.
- Browser back/forward emits `volt:popstate` and refreshes the signal.

Combine this mode with the navigate plugin to keep a global router signal in lockstep with address bar changes.

## Handling Missing Signals

If the plugin cannot resolve `signalPath` it logs a descriptive error and aborts. Ensure your scope exports naming matches when wiring bindings.

## Cleanup

Each mode registers the necessary event listeners (`popstate`, `hashchange`, `volt:navigate`) and unsubscribes during cleanup, so no manual teardown is required. All timers are also cleared to prevent stale updates.
