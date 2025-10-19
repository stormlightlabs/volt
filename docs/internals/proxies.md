# Proxy Objects

Volt's reactive proxy system implements deep reactivity for objects and arrays. Unlike `signal()` which wraps a single value, `reactive()` creates a transparent proxy where property access feels natural while maintaining full reactivity.

## Core Design

The reactive system uses JavaScript Proxies to intercept property access and mutations.
Each reactive proxy is backed by the original raw object and a map of signals: one signal per property, created lazily on first access.

This design provides:

**Transparency**: Access `obj.count` instead of `obj.count.get()`. The proxy unwraps signals automatically.

**Deep Reactivity**: Nested objects and arrays are recursively wrapped, so `obj.nested.value` is reactive all the way down.

**Lazy Signals**: Signals are only created when properties are accessed. An object with 100 properties only creates signals for the properties you actually use.

**Native Array Methods**: Array mutators like `push`, `pop`, `splice` work naturally and trigger updates correctly.

## Three WeakMaps

The system uses three WeakMaps to track relationships:

1. `reactiveToRaw` maps from reactive proxy to original object. Used by `toRaw()` to unwrap proxies and by `isReactive()` to check if something is already a proxy.
2. `rawToReactive` maps from original object to reactive proxy.
    This ensures only one proxy per object. Calling `reactive()` twice on the same object returns the same proxy instance.
3. `targetToSignals` maps from target object to a Map of property signals.
    Each target has its own Map of `(key: string | symbol) -> Signal`. Signals are created lazily in `getPropertySignal()`.

WeakMaps allow us to avoid preventing garbage collection of proxies or targets.

## Property Access (get trap)

When you access `proxy.count`, the get trap:

1. Checks for special keys: `__v_raw` returns the raw target, `__v_isReactive` returns true. These enable introspection.
2. For arrays, checks if the key is a mutator method (`push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`).
If so, returns a wrapper function that applies the mutation to the target, then updates all affected index signals and the length signal.
3. Gets or creates the signal for this property via `getPropertySignal()`.
4. Calls `recordDep(sig)` to track this access for dependency tracking (if inside a computed or effect).
5. Gets the actual value using `Reflect.get()`.
6. If the value is an object, wraps it recursively with `reactive()` before returning. This provides deep reactivity.
7. If the value is not an object, returns `sig.get()` which provides the signal's current value.

The subtle difference in step 6-7 is important: for objects, we return the reactive proxy (not the signal value), so you get `obj.nested.prop` not `obj.nested.get().prop`. But dependency tracking still happens because we called `recordDep()` in step 4.

## Property Mutation (set trap)

When you assign `proxy.count = 5`, the set trap:

1. Reads the old value via `Reflect.get()`.
2. Performs the actual mutation with `Reflect.set()`.
3. If the value changed (old !== new), gets the property signal and calls `sig.set(value)`.
4. Returns the result from `Reflect.set()` to indicate success.

This ensures that mutations to the raw object and signal notifications happen atomically.

## Property Deletion (deleteProperty trap)

When you `delete proxy.count`:

1. Checks if the property existed with `Reflect.has()`.
2. Performs the deletion with `Reflect.deleteProperty()`.
3. If the property existed and deletion succeeded, gets the property signal and sets it to `undefined`.
4. Returns the deletion result.

Setting the signal to `undefined` ensures any computeds or effects depending on that property get notified about the deletion.

## Property Existence (has trap)

The `in` operator (`'count' in proxy`) goes through the has trap:

1. Gets the property signal (creating it if needed).
2. Records the dependency with `recordDep()`.
3. Returns `Reflect.has()` result.

This makes property existence checks reactive. If you have a computed like `() => 'count' in state`, it will rerun if that property is added or deleted.

## Array Mutators

Arrays get special handling because native methods like `push` mutate multiple indices simultaneously. The array mutator wrapper:

1. Gets the array method from the target (e.g., `Array.prototype.push`).
2. Records the old length.
3. Applies the method to the target with the provided arguments.
4. Calculates the new length and determines the maximum index that might have changed.
5. Loops through all potentially affected indices, gets/creates their signals, and updates them with the new values from the target.
6. If the length changed, updates the length signal.
7. Returns the result from the native method.

This approach ensures that mutations like `arr.splice(1, 2, 'a', 'b', 'c')` correctly update all affected index signals and the length signal, triggering computeds that depend on those indices.

The mutator list is hardcoded as a Set: `['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin']`.
Array methods that don't mutate (like `map`, `filter`, `slice`, `toSorted`) go through the normal get trap and return the native method bound to the target.

## Signal Creation

The `getPropertySignal()` helper:

1. Gets the Map of signals for this target from `targetToSignals`, or creates one if needed.
2. Looks up the signal for this specific key in the Map.
3. If no signal exists, reads the initial value from the target with `Reflect.get()`, creates a new signal with that value, and stores it in the Map.
4. Returns the signal.

This lazy creation means that accessing a property for the first time has a small overhead (creating the signal and Map entries), but subsequent accesses just look up the existing signal.

## Integration with Signal System

The reactive proxy system sits on top of the signal system. Each reactive property is backed by a signal created via `signal()` from the core signal module.
When you access `proxy.count`, you're actually calling `get()` on the signal for the 'count' property. When you assign `proxy.count = 5`, you're calling `set(5)` on that signal.
This means all the signal behavior works: dependency tracking via `recordDep()`, subscriber notifications, equality checks (`value === newValue` to prevent unnecessary updates).
The proxy just provides a more convenient API so you'll use something like `obj.count++` instead of `obj.count.set(obj.count.get() + 1)`.

## Deep Reactivity

Nested objects are made reactive recursively. When the get trap encounters an object value, it wraps it with `reactive()` before returning.

The `reactive()` function itself checks `rawToReactive` first, so if that nested object was already wrapped, it returns the existing proxy. This means:

```ts
const state = reactive({ nested: { count: 0 } });
const nested1 = state.nested;
const nested2 = state.nested;
nested1 === nested2; // true, same proxy
```

Arrays within reactive objects are also proxied, and arrays containing objects have those objects proxied when accessed:

```ts
const state = reactive({ items: [{ id: 1 }, { id: 2 }] });
state.items[0].id = 3; // fully reactive
state.items.push({ id: 4 }); // also reactive
```

## Unwrapping with toRaw

The `toRaw()` function unwraps a proxy to get the original object. It checks if the value is an object, then looks it up in `reactiveToRaw`. If not found, returns the value as-is (it wasn't a proxy).

This is useful when you need to pass the raw object to third-party libraries that might not handle proxies well, or when you want to do mutations without triggering reactivity (though this is rarely needed).

## Checking Reactivity

The `isReactive()` function checks if a value is a reactive proxy by testing if it's an object and exists in `reactiveToRaw`.
This is simpler than checking for the `__v_isReactive` property because it doesn't trigger the get trap.

## Type Safety

TypeScript types flow through transparently. If you pass `{ count: number }` to `reactive()`, you get back a reactive object typed as `{ count: number }`.
The proxy is invisible to the type system. This is possible because Proxies preserve the object's interface keeping all properties and methods accessible with the same types.

## Performance Characteristics

- Creating a reactive proxy has minimal overhead, as it just creates the Proxy object and adding two WeakMap entries.
    - The first property access has the overhead of creating a signal and Map entries.
    - Subsequent property access is very fast
        - WeakMap lookup for the signal Map, then Map lookup for the signal, then signal.get().
    - Mutations are similarly fast
        - WeakMap lookups plus signal.set().
    - The WeakMaps have zero memory overhead for garbage collection so when a proxy is no longer referenced, all its metadata is collected automatically.
- Arrays are slightly slower due to the mutator wrappers, but still $O(n)$ in the number of affected elements, which matches the native method's complexity.

## Edge Cases

**Non-object values**: `reactive()` logs a warning and returns the value unchanged.
You can't make primitives reactive without wrapping them in a `signal()`.

**Already reactive**: Calling `reactive()` on a proxy returns the same proxy immediately.

**Prototype pollution**: The proxy traps use `Reflect` methods which respect the prototype chain naturally.
No special protection is needed because signals are stored in a separate WeakMap, not on the object itself.

**Symbol properties**: Fully supported. Symbols can be used as property keys and get their own signals just like string keys.

**Non-enumerable properties**: Work correctly. The get/set traps handle them the same as enumerable properties.

**Frozen/sealed objects**: Setting properties on frozen objects will fail in `Reflect.set()` and the set trap will return false.
The signal won't be updated, maintaining consistency.

## Signal vs. Reactive

Use `signal()` when:

- You have a single primitive value
- You want explicit get/set calls
- You're storing a function (functions can't be proxy targets)

Use `reactive()` when:

- You have an object with multiple properties
- You want natural property access syntax
- You have nested objects or arrays
- You're integrating with code that expects plain objects

Both are backed by the same signal primitive. The choice is about API ergonomics, not capability.

## Implementation Notes

The proxy system is implemented in `lib/src/core/reactive.ts` and depends only on `signal()` and `recordDep()` from the tracker.
It's completely independent of the binding system, expression evaluator, and other framework features.

This separation means you can use reactive objects in any context:
    - In the DOM binding system via `data-volt-*` attributes
    - Programmatic code with `mount()`
    - Standalone without any UI at all.

The declarative `data-volt-state` attribute in the charge system creates reactive objects from JSON, making deep reactivity available in fully declarative apps without writing any JavaScript.
