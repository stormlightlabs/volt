# Reactivity

Signals power Volt’s imperative runtime as plain getters/setters with pub-sub on top. The implementation lives in `src/core/signal.ts` and exposes three primitives.

## Core

### Signals

- API signature: `signal<T>(initialValue: T): Signal<T>`

- `get()` MUST synchronously return the last committed value.
- `set(next)` MUST compare `next` to the current value using `===` and MUST skip notification when the comparison returns true.
- When `set` commits a new value it MUST synchronously invoke every registered subscriber in the order they were added.
    - Subscriber errors MUST be caught and logged through `console.error`.
- `subscribe(listener)` MUST add the listener, MUST NOT invoke it immediately, and MUST return a teardown function that, when called, removes the listener so it receives no further notifications.
- Multiple subscriptions of the same listener are allowed; each teardown MUST only remove the corresponding registration.

### Computed State

- API signature: `computed<T>(compute: () => T, deps: Array<Signal | ComputedSignal>): ComputedSignal<T>`

- Construction MUST synchronously evaluate `compute()` once to produce the initial value.
    - Exceptions thrown by `compute` MUST propagate to the caller.
- Each dependency in `deps` MUST be subscribed exactly once at construction.
    - Missing dependencies result in stale values and are the caller’s responsibility.
- When any dependency publishes, the computed MUST recompute immediately, compare the new value with the previous value using `===`, and MUST notify subscribers only when the value changes.
- Subscribers follow the same contract as `signal.subscribe`: synchronous notifications, no immediate call on registration, teardown removes the listener, errors are logged.

### Effects

- API signature: `effect(fn: () => void | (() => void), deps: Array<Signal | ComputedSignal>): () => void`

- The runtime MUST execute `fn` immediately after subscription.
    - Exceptions MUST be caught and logged; execution continues for subsequent notifications.
- If `fn` returns a cleanup function, the runtime MUST invoke that cleanup before the next execution of `fn` and during teardown.
- The runtime MUST subscribe to each dependency once. When a dependency publishes, it MUST rerun `fn` synchronously and manage cleanup as described above.
- The teardown function returned by `effect` MUST unsubscribe from all dependencies and MUST invoke any pending cleanup exactly once.

### Gaps

- No automatic dependency tracking; most frameworks infer dependencies from getters.
- Equality checks are strict (`===`), so structural equality or NaN handling requires user code.
- Notifications run synchronously; there is no batching, scheduling, or microtask deferral.
- Signals cannot be inspected for previous values or dependency graphs, limiting debugging tooling.
- There is no built-in way to pause/resume computed values or effects besides manual unsubscribe.

## Markup Based Reactivity

Volt’s runtime should be able to hydrate declarative markup without developer-authored boot scripts.
This section describes the contract for the markup-only mode so plugin authors and docs stay aligned while the loader is implemented.

### Bootstrapping

- `volt` MUST auto-discover mount points marked with `data-volt-root`, `data-volt`, or an equivalent attribute.
- The bootstrapper MUST initialize exactly one reactive scope per root node.
- A root MAY opt out of auto-init by setting `data-volt="false"`.
- During hydration the loader MUST parse `data-volt-state` on the root; the attribute holds a JSON literal that seeds top-level signals.

### Declaring State

- Primitive state lives under `data-volt-state='{"newTodo":"","todos":[]}'`.
    - Each key becomes a writable `signal`.
- Derived values are declared with `data-volt-computed:name="expression"`; the loader builds a computed that depends on every identifier referenced in the expression.
- Global helpers (e.g., `state.todos`, `helpers.length`) must be documented so HTML authors know what bindings are available without custom scripts.

### Binding Expressions

- Attribute bindings use `data-volt-bind:attr="expression"`; the runtime keeps the DOM attribute/property in sync with the expression value.
- For text nodes, `data-volt-text="expression"` renders the latest scalar; internally this is just a one-off text binding.
- Two-way form bindings use `data-volt-model="stateKey"`; the loader wires native input events back to the matching signal.
- Class and style shorthands (`data-volt-class:active="expression"`) mirror the existing imperative helpers.

### Control Flow

- Lists are rendered with `data-volt-for="item, index in todos"` on a `<template>` element; the loader clones the template per entry and exposes loop variables plus `$parent` for outer scope access.
- Conditional blocks use `data-volt-if="expression"` with optional `data-volt-else`; only the truthy branch remains in the DOM.
- Loops and conditionals share cleanup semantics with imperative mounts: nodes created by the runtime must unsubscribe from signals when removed.

### Event Handling

- Event handlers are declared with `data-volt-on:event="statement"` and execute inside the reactive scope with access to helper utilities.
- Mutations must target signals or proxied arrays so change tracking fires.
- Custom plugins can register additional helpers accessible from markup, but they must be namespaced (e.g., `persist.save()`).

### Example Skeleton

```html
<div data-volt data-volt-state='{"newTodo":"","todos":[] }'>
  <form data-volt-on:submit="addTodo(newTodo)">
    <input data-volt-model="newTodo" placeholder="What needs to be done?" />
  </form>

  <ul>
    <template data-volt-for="todo, idx in todos">
      <li data-volt-class:completed="todo.completed">
        <input type="checkbox" data-volt-model="todo.completed" />
        <span data-volt-text="todo.title"></span>
        <button data-volt-on:click="removeTodo(idx)">×</button>
      </li>
    </template>
  </ul>

  <p data-volt-if="todos.length === 0">Everything done!</p>
</div>
```

### Security & Parsing Notes

- Expression strings are evaluated inside a sandboxed `Function` wrapper scoped to the current reactive state; no global objects other than the documented helper bag may leak in.
- The loader must reject unparseable JSON in `data-volt-state` and surface clear warnings so authors can debug by inspecting the console.
- Because hydration occurs after `DOMContentLoaded`, SSR must emit a `<script type="application/json">` fallback when markup-only authors need immediate scope initialization.
