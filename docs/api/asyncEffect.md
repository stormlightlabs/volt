---
version: 1.0
updated: 2025-10-18
---

# asyncEffect

Async effect system with abort, race protection, debounce, throttle, and error handling

## asyncEffect

Creates an async side effect that runs when dependencies change.
Supports abort signals, race protection, debouncing, throttling, and error handling.

```typescript
export function asyncEffect( effectFunction: AsyncEffectFunction, dependencies: Array<Signal<unknown> | ComputedSignal<unknown>>, options: AsyncEffectOptions = {}, ): () => void
```

**Example:**

```typescript
// Fetch with abort on cleanup
const query = signal('');
const cleanup = asyncEffect(async (signal) => {
  const response = await fetch(`/api/search?q=${query.get()}`, { signal });
  const data = await response.json();
  results.set(data);
}, [query], { abortable: true });

// Debounced search
asyncEffect(async () => {
  const response = await fetch(`/api/search?q=${searchQuery.get()}`);
  results.set(await response.json());
}, [searchQuery], { debounce: 300 });

// Error handling with retries
asyncEffect(async () => {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('Failed to fetch');
  data.set(await response.json());
}, [refreshTrigger], {
  retries: 3,
  retryDelay: 1000,
  onError: (error, retry) => {
    console.error('Fetch failed:', error);
    // Optionally call retry() to retry immediately
  }
});
```
