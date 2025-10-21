# Bindings & Evaluation

VoltX’s binding layer is the glue between declarative `data-volt-*` attributes and the reactivity primitives that drive them.
Here we explain how the binder walks the DOM, how directives are dispatched, how expressions are compiled and executed, and the guardrails we erected while hardening the evaluator.

## Mount Pipeline

1. **Scope preparation** - `mount(root, scope)` first injects VoltX’s helper variables (`$store`, `$uid`, `$pins`, `$probe`, etc.) into the caller-provided scope.
   Helpers are frozen before exposure so user code cannot tamper with framework utilities.
2. **Tree walk** - We perform a DOM walk rooted at `root`, skipping subtrees marked with `data-volt-skip`.
   Elements cloaked with `data-volt-cloak` are un-cloaked during traversal.
3. **Attribute collection** - `getVoltAttrs()` extracts `data-volt-*` attributes and normalises modifiers (e.g. `data-volt-on-click.prevent` -> `on-click` with `.prevent`).
4. **Directive dispatch** - Structural directives (`data-volt-for`, `data-volt-if`) short-circuit the attribute loop because they clone/remove nodes.
   Everything else is routed through `bindAttribute()` which:
   - Routes `on-*` attributes to the event binding pipeline.
   - Routes `bind:*` aliases (e.g. `bind:value`) to attribute binding helpers.
   - For colon-prefixed segments (`data-volt-http:get`), hands control to plugin handlers.
   - Falls back to the directive registry or plugin registry, then logs an unknown binding warning.
5. **Lifecycle hooks** - Each bound element fires the global lifecycle callbacks (`beforeMount`, `afterMount`, etc.).
   Per-plugin lifecycles are surfaced via `PluginContext.lifecycle`.

Each directive registers clean-up callbacks so `mount()` can return a disposer that un-subscribes signals, removes event listeners, and runs plugin uninstall hooks.

## Directive Registry

We expose `registerDirective(name, handler)` to allow plugins to self-register.
Core only ships the structural directives and the minimal attribute/event set required for the base runtime.
This keeps the lib bundle slim and allows tree shaking to drop unused features.

`registerDirective()` is side-effectful at module evaluation time. Optional packages import the binder, call `registerDirective()`, and expose their entry point via Vite’s plugin system.
Consumers that never import the module never pay for its directives.

## Expression Compilation

All binding expressions funnel through `evaluate(expr, scope)` (or `evaluateStatements()` for multi-statement handlers).
The evaluator implements a few layers of defense:

### Cached `new Function`

- Expressions are compiled into functions with `new Function("$scope", "$unwrap", ...)`.
- We wrap execution in a `with ($scope) { ... }` block to preserve ergonomic access to identifiers.
- Compiled functions are cached in a `Map` keyed by the expression string + mode (`expr` vs `stmt`)
   Cache hits avoid re-parsing and reduce GC churn.

### Hardened Scope Proxy

`createScopeProxy(scope)` builds an `Object.create(null)` proxy that:

- Returns `undefined` for dangerous identifiers and properties (`constructor`, `__proto__`, `globalThis`, `Function`, etc.).
- Reuses VoltX’s `wrapValue()` utility to auto-unwrap signals while guarding against prototype pollution.
- Treats setters specially: if a scope entry is a signal, assignments route to `signal.set()`.
- Spoofs `has` so the `with` block never falls through to `globalThis`.

Every call to `evaluate()` constructs this proxy and iss fast because signals and helpers are stored on the original scope, not the proxy.

### Safe Negation & `$unwrap`

Logical negation (`!signal`) is tricky when signals are proxied objects.
Before compilation we run `transformExpression()` which rewrites top-level `!identifier` patterns into `!$unwrap(identifier)`.
`$unwrap()` dereferences signals without exposing their methods, making boolean coercion reliable even when the underlying value is a reactive proxy or computed signal.

### Signal-Aware Wrapping

`wrapValue()` enforces blocking rules and auto-unwrapping:

- Signal reads return a small proxy exposing `get`, `set`, and `subscribe` while delegating property reads to the underlying value.
- Nested values re-enter `wrapValue()` so the entire object graph respects the hazardous-key deny list.
- When `unwrapSignals` is enabled (default for read contexts), signal reads return their current value so DOM bindings can treat them like plain data.
- Statement contexts (event handlers, `data-volt-init`) pass `{ unwrapSignals: false }` so authors can still call `count.set()` or `store.set()` directly.

### Error Surfacing

Any runtime error thrown by the compiled function is wrapped in `EvaluationError` which carries the original expression for better debugging.
Reference errors (missing identifiers) return `undefined` to mimic plain JavaScript.

## Event Handlers

`data-volt-on-*` bindings support modifiers (`prevent`, `stop`, `self`, `once`, `window`, `document`, `debounce`, `throttle`, `passive`). Before executing the handler we assemble an `eventScope` that inherits the original scope but adds `$el` and `$event`. Statements run sequentially; the last value is returned. If the handler returns a function we invoke it with the triggering event to mimic inline handler ergonomics (`data-volt-on-click="(ev) => fn(ev)"`).

Debounce/throttle modifiers wrap the execute function with cancellable helpers. Clean-up hooks clear timers when the element unmounts.

## Structural/Control Directives

### `data-volt-if`

- Clones/discards `if` and optional `else` templates.
- Evaluates the condition reactively; dependencies are tracked via `extractDeps()` which scans expressions for signals.
- Supports surge transitions by awaiting `executeSurgeEnter/Leave()` when available.
- Maintains branch state so redundant renders are skipped. Clean-up disposes child mounts when a branch is swapped out.

### `data-volt-for`

- Parses `"item in items"` or `"(item, index) in items"` grammar.
- Uses a placeholder comment to maintain insertion position.
- Re-renders on dependency changes by clearing existing clones and re-mounting with a child scope containing the loop variables.
- Registers per-item clean-up disposers so each clone tears down correctly.

## Data Flow & Dependency Tracking

Reactive updates rely on `updateAndRegister(ctx, update, expr)`:

1. Executes the update function immediately for initial DOM synchronisation.
2. Calls `extractDeps()` to gather signals referenced within the expression (with special handling for `$store.get()` lookups).
3. Subscribes to each signal and pushes the unsubscribe callback into the directive’s clean-up list.

This pattern is used by text/html bindings, class/style bindings, show/if/for, and plugin-provided directives.

## Challenges & Lessons

- **Security vs ergonomics** - Moving from a hand-rolled parser to `new Function` simplified expression support but introduced sandboxing risks.
   The scope proxy and whitelists were essential to close off prototype pollution and global escape hatches.
- **Signal negation** - `!signal` originally returned `false` because the proxy object was truthy.
   The `$unwrap` transformation ensures boolean logic matches user expectations without forcing explicit `.get()` calls.
- **Plugin isolation** - Allowing plugins to register directives meant we had to guarantee that the core binder stays stateless.
   Directive handlers receive a `PluginContext` with controlled capabilities so they can integrate without mutating internal machinery.
- **Error visibility** - Swallowing exceptions made debugging inline expressions painful.
   `EvaluationError` and consistent logging in directives give developers actionable stack traces while keeping the runtime resilient.

With these guardrails the binder provides a secure, extensible bridge between declarative templates and VoltX’s reactive runtime.
