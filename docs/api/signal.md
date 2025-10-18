---
version: 1.0
updated: 2025-10-18
---

# signal

Creates a new signal with the given initial value.

@param initialValue - The initial value of the signal
@returns A Signal object with get, set, and subscribe methods

@example
const count = signal(0);
count.subscribe(value => console.log('Count:', value));
count.set(1); // Logs: Count: 1

## signal

Creates a new signal with the given initial value.

```typescript
export function signal<T>(initialValue: T): Signal<T>
```

**Example:**

```typescript
const count = signal(0);
count.subscribe(value => console.log('Count:', value));
count.set(1); // Logs: Count: 1
```

## computed

Creates a computed signal that derives its value from other signals.
The computation function is re-run whenever any of its dependencies change.

```typescript
export function computed<T>( compute: () => T, dependencies: Array<Signal<unknown> | ComputedSignal<unknown>>, ): ComputedSignal<T>
```

**Example:**

```typescript
const count = signal(5);
const doubled = computed(() => count.get() * 2, [count]);
doubled.get(); // 10
count.set(10);
doubled.get(); // 20
```

## effect

Creates a side effect that runs when dependencies change.

```typescript
export function effect( effectFunction: () => void | (() => void), dependencies: Array<Signal<unknown> | ComputedSignal<unknown>>, ): () => void
```

**Example:**

```typescript
const count = signal(0);
const cleanup = effect(() => {
  console.log('Count changed:', count.get());
}, [count]);
```
