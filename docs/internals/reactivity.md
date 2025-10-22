# Reactivity Architecture

VoltX’s reactivity system is built around a small set of primitives—signals, computed signals, and effects—that coordinate via an explicit dependency tracker.
This document explains how those pieces fit together, how updates flow through the system, and the trade-offs we made while hardening the implementation.

## Signals

`signal(initialValue)` returns an object with three methods:

- `get()` records dependency access (via `recordDep`) and returns the current value.
- `set(next)` performs a referential equality check; if the value changed it notifies subscribers.
- `subscribe(listener)` registers callbacks that fire on every change and returns an unsubscribe function.

Signals store subscribers in a `Set`, so multiple identical subscriptions are deduplicated. Notifications are delivered over a shallow copy of the subscriber list to guard against mutation during iteration, and errors inside a subscriber are caught and logged so one faulty listener cannot collapse the cascade.

## Dependency Tracking

The tracker module exposes `startTracking(source?)`, `recordDep(dep)`, and `stopTracking()`.

The active tracking context lives on a stack:

1. A computed or effect calls `startTracking(source)` before evaluating its body.
2. Each signal’s `get()` sees the active context and adds itself to the context’s dependency set.
3. After the body executes, `stopTracking()` pops the context and returns the unique set of dependencies.

Cycle detection is enforced by comparing the `source` passed to `startTracking()` with the dependency being recorded.
If they match we throw, preventing self-referential computeds from hanging the system.

## Computed Signals

`computed(fn)` wraps a pure function that may read other signals or computeds. Key behaviours:

- Lazily initialised on first `get()` or `subscribe()` call (`recompute()` runs only when needed).
- During recomputation we unsubscribe from all previous dependencies, start a new tracking context, run `fn`, then subscribe to the newly discovered dependencies.
- Re-entrancy protection guards against accidental recursive loops by throwing when we detect a recompute while one is already running (often a sign of cyclic dependencies).
- If the derived value changes and there are downstream subscribers we notify them immediately.

Because a computed emits a Signal-like interface, it can be used anywhere a regular signal appears (e.g. bindings, store, nested computeds).

## Effects

`effect(fn)` is VoltX’s autorun/side effect primitive. Internally it mirrors `computed`:

1. Runs `fn` inside a tracking context.
2. Subscribes to dependencies and re-runs when any change.
3. Supports cleanups: if `fn` returns a function we call it before the next run (or on disposal).

The returned disposer clears all subscriptions and performs a final cleanup.
Effects are deliberately eager. They run once on creation so initialisation logic (like attaching event listeners) happens immediately.

## Reactive Objects

While this document focuses on signals, most application code interacts with `reactive()` objects.
These are proxies backed by signals; property reads call `signal.get()`, writes call `signal.set()`.
See [Proxy Objects](./proxies) for a detailed discussion.

## Expression Evaluation and Signal Unwrapping

The expression evaluator bridges declarative markup with the reactive core. It compiles attribute expressions into functions that run in a sandboxed scope proxy.

### Auto-Unwrapping Behavior

By default, the evaluator automatically unwraps signals in read contexts (bindings like `data-volt-text`, `data-volt-if`, etc.). This enables natural comparisons and operations:

```html
<div data-volt data-volt-state='{"page": "home"}'>
  <!-- page signal is auto-unwrapped, so === comparison works -->
  <div data-volt-if="page === 'home'">Home Content</div>
</div>
```

Without auto-unwrapping, strict equality (`===`) would compare the signal wrapper object to the string `'home'`, always returning false. Auto-unwrapping ensures the comparison uses the signal's value.

### Event Handlers

In event handlers (`data-volt-on-*`) and initialization code (`data-volt-init`), signals are **not** auto-unwrapped. This preserves access to signal methods like `.set()` and `.subscribe()`:

```html
<button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
```

### Implementation

The evaluator uses a scope proxy that wraps signal objects differently based on context:

- **Read mode** (`unwrapSignals: true`): Returns the signal's value for transparent comparisons
- **Write mode** (`unwrapSignals: false`): Returns a wrapped signal with `.get()`, `.set()`, and `.subscribe()` methods

This dual behavior is controlled by the `opts.unwrapSignals` parameter passed to `evaluate()`.

## Scope Helpers

When a scope is mounted, VoltX injects several helpers that lean on the reactive core:

- `$pulse(cb)` queues `cb` on the microtask queue.
    It's often used to observe the DOM after reactive updates settle.
- `$probe(expr, cb)` bridges the evaluator and the tracker.
    It uses `extractDeps()` to pre-compute dependencies for the expression, subscribes to them, and re-evaluates via `evaluate()` on change.
- `$arc`, `$uid`, `$pins`, `$store`, and `$probe` all use the same subscription mechanics.
    When they touch signals they automatically participate in the dependency graph.

These helpers ensure that advanced patterns (imperative probes, custom event dispatch) stay aligned with reactive guarantees.

## Update Propagation

1. A signal’s `set()` runs, updates the value, and invokes each subscriber.
2. Computed subscribers (registered via `dep.subscribe(recompute)`) recompute, so if their value changes they notify their own subscribers.
3. Effects rerun, repeating their tracking cycle.
4. DOM bindings registered through `updateAndRegister()` receive the update and perform minimal DOM writes.

VoltX does not batch updates automatically. Calling `set()` twice in a row will push two notifications.
When batching is needed, use `$pulse` or wrap updates in a custom queue.

## Challenges & Trade-offs

- **Minimal core vs features** - The system intentionally avoids hidden mutation queues or scheduler magic.
This keeps mental models simple but means users must explicitly batch when necessary.
- **Signal identity** - Equality checks are referential.
    While fast, it means that mutating nested objects without cloning can bypass change detection unless you touch the signal again.
    We emphasises immutable patterns or explicit `set()` calls with copies.
- **Dependency discovery** - Parsing expressions to pre-collect dependencies (`extractDeps`) introduces heuristics (e.g. `$store.get()` handling).
    We balance accuracy with performance by focusing on common patterns and falling back to runtime evaluation if static analysis fails.
- **Error resilience** - Subscriber callbacks, cleanup functions, and recompute bodies are wrapped in try/catch to prevent one failure from derailing the reactive loop.
    The trade-off is noisy console logs, but the alternative—silently swallowing issues—was harder to debug.

Despite the lightweight implementation, these primitives provide deterministic, traceable update flows that underpin VoltX’s declarative bindings and plugin ecosystem.
