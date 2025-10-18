---
version: 1.0
updated: 2025-10-18
---

# signal

A reactive primitive that notifies subscribers when its value changes.

## Signal

A reactive primitive that notifies subscribers when its value changes.

## ComputedSignal

A computed signal that derives its value from other signals.

## signal

Creates a new signal with the given initial value.
Signals are reactive primitives that automatically notify subscribers when changed.

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
Effects run immediately on creation and whenever dependencies update.

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
