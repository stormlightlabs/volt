# Reactivity

VoltX uses signal-based reactivity for state management. State changes automatically trigger DOM updates without virtual DOM diffing or reconciliation.

## Reactive Primitives

### Signals

Signals are the foundation of reactive state.
A signal holds a single value that can be read, written, and observed for changes.

Create signals using the `signal()` function, which returns an object with three methods:

- `get()` returns the current value
- `set(newValue)` updates the value and notifies subscribers
- `subscribe(callback)` registers a listener for changes

Signals use strict equality (`===`) to determine if a value has changed.
Setting a signal to its current value will not trigger notifications.

### Computed Values

Computed signals derive their values from other signals. They automatically track dependencies and recalculate only when those dependencies change.

The `computed()` function takes a calculation function and a dependency array.
The framework ensures computed values stay synchronized with their sources.

Computed values are read-only and should not produce side effects. They exist purely to transform or combine other state.

### Effects

Effects run side effects in response to signal changes. The `effect()` function executes immediately and re-runs whenever its dependencies update.

Common uses include:

- Synchronizing with external APIs
- Logging or analytics
- Coordinating multiple signals

For asynchronous operations, use `asyncEffect()` (see [asyncEffect](./async-effect)) which handles cleanup of pending operations when dependencies change or the effect is disposed.

## Declarative State

The preferred approach for most applications is declaring state directly in HTML using the `data-volt-state` attribute. This eliminates the need to write JavaScript for basic state management.

State is declared as inline JSON on any element with the `data-volt` attribute:

```html
<div data-volt data-volt-state='{"count": 0, "items": []}'>
```

The framework automatically converts these values into reactive signals.
Nested objects and arrays become reactive, and property access in expressions automatically unwraps signal values.

### Computed Values in Markup

Derive values declaratively using `data-volt-computed:name` attributes.
The name becomes a signal in the scope, and the attribute value is the computation expression:

```html
<div data-volt
     data-volt-state='{"count": 5}'
     data-volt-computed:doubled="count * 2">
```

Computed values defined this way follow the same rules as programmatic computed signals: they track dependencies and update automatically.
For multi-word signal names, prefer kebab-case in the attribute (e.g., `data-volt-computed:active-todos`) — HTML lowercases attribute names and Volt converts kebab-case back to camelCase (`activeTodos`) automatically.

## Programmatic State

For complex applications requiring initialization logic or external API integration, create signals programmatically and pass them to the `mount()` function.

This approach gives you full control over signal creation, composition, and lifecycle. Use it when:

- State initialization requires async operations
- Signals need to be shared across multiple mount points
- Complex validation or transformation logic is needed
- Integration with external state management is required

## Scope and Access

Each mounted element creates a scope containing its signals and computed values.
Bindings access signals by property path relative to their scope.

When using declarative state, the scope is built automatically from `data-volt-state` and `data-volt-computed:*` attributes.

When using programmatic mounting, the scope is the object passed as the second argument to `mount()`.

Bindings can access nested properties, and the evaluator automatically unwraps signal values.
Event handlers receive special scope additions: `$el` for the element and `$event` for the event object.

## Signal Auto-Unwrapping

VoltX automatically unwraps signals in read contexts, making expressions simpler and more natural:

```html
<div data-volt data-volt-state='{"count": 5, "name": "Alice"}'>
  <!-- Signals are automatically unwrapped in bindings -->
  <p data-volt-text="count"></p>
  <p data-volt-if="count > 0">Count is positive</p>
  <p data-volt-if="name === 'Alice'">Hello Alice!</p>

  <!-- In event handlers, use .get() to read and .set() to write -->
  <button data-volt-on-click="count.set(count.get() + 1)">Increment</button>
</div>
```

**Read Contexts** (signals auto-unwrapped):

- `data-volt-text`, `data-volt-html`
- `data-volt-if`, `data-volt-else`
- `data-volt-for`
- `data-volt-class`, `data-volt-style`
- `data-volt-bind:*`
- `data-volt-computed:*` expressions

**Write Contexts** (signals not auto-unwrapped):

- `data-volt-on-*` event handlers
- `data-volt-init` initialization code
- `data-volt-model` (handles both read and write automatically)

This design allows strict equality comparisons (`===`) to work naturally in conditional rendering while preserving access to signal methods like `.set()` in event handlers.

## State Persistence

Signals can be synchronized with browser storage using the built-in persist plugin.
See the plugin documentation (coming soon!) for details on localStorage, sessionStorage, and IndexedDB integration.

## State Serialization

For server-side rendering, signals can be serialized to JSON and embedded in HTML for hydration on the client. This preserves state across the server-client boundary.

Only serialize base signals containing primitive values, arrays, and plain objects. Computed signals are recalculated during hydration and should not be serialized.

See the [Server-Side Rendering guide](./ssr) for complete hydration patterns.

## Guidelines

### Performance

- Keep signal values immutable when possible. Create new objects rather than mutating existing ones
- Use computed signals to avoid redundant calculations
- Avoid creating signals inside loops or frequently-called functions

### Architecture

- Prefer declarative state for simple, self-contained components
- Use programmatic state for complex initialization or cross-component coordination
- Keep state close to where it's used: avoid deeply nested property access
- Structure state with consistent shapes to prevent runtime errors in expressions

### Debugging

Signal updates are synchronous and deterministic. To trace state changes:

- Use browser DevTools to set breakpoints in signal `.set()` calls
- Subscribe to signals and log changes for debugging
- Enable VoltX.js lifecycle hooks to observe mount and binding creation

All errors in effects and subscriptions are caught and logged rather than thrown, preventing cascade failures.
