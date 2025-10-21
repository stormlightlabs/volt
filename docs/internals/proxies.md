# Proxy Objects

Volt’s `reactive()` helper wraps plain objects and arrays in Proxies that expose deep reactivity while defending against prototype-pollution and sandbox escapes.
This document details how the proxies are constructed, how they integrate with signals, and where the guardrails live.

## Goals

- **Transparency** - Accessing `state.user.name` should feel like working with a plain object, without explicit `.get()` calls.
- **Deep reactivity** - Nested objects, arrays, and symbols participate automatically.
- **Safety** - Dangerous keys such as `__proto__` or `constructor` are blocked regardless of depth.
- **Single source of truth** - Each raw object maps to exactly one proxy, keeping identity stable and ensuring watchers de-duplicate work.

## Core Data Structures

Three WeakMaps maintain relationships:

1. `rawToReactive` - From raw object to proxy. Guarantees we never create two proxies for the same target.
2. `reactiveToRaw` - Reverse lookup used by `toRaw()` and `isReactive()`.
3. `targetToSignals` - Maps a raw target to a `Map<key, Signal>`. Each property lazily receives a signal the first time it’s accessed.

WeakMaps ensure metadata is collected with the target; no explicit teardown is required.

## Property Access (get trap)

When a consumer reads `proxy.key`:

1. **Special escape hatches** - `__v_raw` returns the raw target, `__v_isReactive` identifies proxies, and `$voltx_debug` (internal) surfaces debugging helpers.
2. **Dangerous key check** - Keys like `"constructor"`, `"prototype"`, `"__proto__"`, or `"globalThis"` immediately return `undefined`.
    This mirrors the evaluator’s hardened scope rules, keeping user expressions and runtime helpers aligned.
3. **Array mutators** - If the target is an array and the key is a mutator (`push`, `splice`, etc.), we return a wrapped function that runs the native method then updates all affected signals (indices + `length`).
4. **Signal retrieval** - `getPropertySignal()` returns/creates the signal for the property and registers it with the dependency tracker.
5. **Value resolution** - The raw value is read via `Reflect.get()`.
    If it’s an object/function, we recursively call `reactive()` so nested access stays reactive.
    Otherwise we return `signal.get()` which unwraps the value.

This layered approach means `reactive()` objects are safe to embed in evaluator scopes—the same dangerous keys are filtered and every nested property remains reactive.

## Property Mutation (set trap)

`proxy.key = value` executes:

1. Reads the previous value with `Reflect.get()` (needed for equality checks).
2. Performs the write via `Reflect.set()`. Failures (e.g. frozen objects) surface as normal `false` return values.
3. If the value changed, updates the property signal with `signal.set(newValue)` triggering downstream computeds/effects.

Assignments to blocked keys (`__proto__`, `constructor`, etc.) are ignored to prevent prototype pollution.
The setter returns `true` so user code doesn’t throw while the runtime remains protected.

## Deletion & Existence

- `delete proxy.key` removes the property via `Reflect.deleteProperty()`, then sets the property signal to `undefined` to notify dependents.
- The `in` operator (`'key' in proxy`) records a dependency and defers to `Reflect.has()`, making existence checks reactive.

## Array Handling

Array methods are wrapped to keep per-index signals in sync:

- We snapshot the array’s pre-mutation length.
- Call the native method on the raw array.
- Compute the range of indices that may have changed and update/create their signals.
- Update the `length` signal if needed.

Methods that do not mutate (e.g. `slice`) pass through unwrapped.

## Integration with Signals

Every reactive property is backed by a `signal`. This keeps the proxy layer thin—core logic lives in `signal.ts`, and the proxy simply orchestrates reads/writes against those signals.
Because signals already integrate with dependency tracking, reactive object reads automatically wire into computeds, effects, and DOM bindings without extra bookkeeping.

## Interop Utilities

- `toRaw(value)` unwraps a proxy by consulting `reactiveToRaw`.
    Useful when passing data to libraries that cannot handle proxies.
- `isReactive(value)` checks presence in `reactiveToRaw` without triggering getters.
- `markRaw(value)` (internal helper) can flag objects that should bypass reactivity, useful for expensive third-party instances.

## Evaluator Interaction

Bindings and expressions run via the hardened evaluator. When it encounters a reactive proxy it uses `wrapValue()` to create a safe view:

- Dangerous keys remain blocked.
- Signals returned from proxy properties expose `get`, `set`, and `subscribe`, but property reads on the signal proxy delegate back to the underlying value.
- Primitive coercion works because the wrapper defines `valueOf`, `toString`, and `Symbol.toPrimitive` on demand.
- Boolean negation (`!signal`) is rewritten to `!$unwrap(signal)` before compilation so reactive values behave like plain booleans.

## Challenges & Lessons

- **Balancing safety and ergonomics** - Blocking hazardous keys everywhere (reactive proxies, evaluator proxies, and scope helpers) keeps the mental model consistent.
    The challenge is ensuring legitimate use cases (e.g. accessing an object’s prototype intentionally) are still possible via `toRaw()` when absolutely required.
- **Array performance** - Naively re-wrapping arrays each mutation was costly.
    Hard-coding mutator wrappers keeps hot paths predictable without introducing per-access allocations.
- **Equality semantics** - Since signals use strict equality, mutating nested objects in place does not trigger updates.
    Documentation and lint rules encourage immutable patterns or explicit reassignments to keep changes observable.
- **Garbage collection** - Using WeakMaps exclusively avoids memory leaks, but it meant giving up on certain debugging tricks (storing strong references to proxies).
    The debug registry in `lib/src/debug` now mirrors relationships explicitly when debugging is enabled.

The proxy layer underpins VoltX’s "plain object" ergonomics while preserving the security posture demanded by the evaluator. Understanding these mechanics helps when extending the runtime or diagnosing subtle update issues.
