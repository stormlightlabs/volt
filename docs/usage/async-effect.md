# Async Effects

Volt’s `asyncEffect` helper runs asynchronous workflows whenever one or more signals change.
It handles abort signals, debounce/throttle scheduling, retries, and cleanup so you can focus on data fetching logic instead of wiring.

## When to use it

- Fetching or mutating remote data in response to signal changes.
- Performing background work that should cancel when inputs flip rapidly.
- Retrying transient failures without duplicating boilerplate.
- Triggering imperative side effects (e.g., analytics) that return cleanups.

## Basic Example

In this example, if you change `query` with `query.set("new value")` the effect re-runs.

```ts
import { asyncEffect, signal } from "voltx.js";

const query = signal("");
const results = signal([]);

asyncEffect(async () => {
  if (!query.get()) {
    results.set([]);
    return;
  }

  const response = await fetch(`/api/search?q=${encodeURIComponent(query.get())}`);
  results.set(await response.json());
}, [query]);
```

If the effect returns a cleanup function it is invoked before the next execution and on disposal.

## Abortable Fetches

Pass `{ abortable: true }` to receive an `AbortSignal`.
VoltX aborts the previous run each time dependencies change or when you dispose the effect.

```ts
asyncEffect(
  async (signal) => {
    const response = await fetch(`/api/files/${fileId.get()}`, { signal });
    data.set(await response.json());
  },
  [fileId],
  { abortable: true },
);
```

## Debounce and Throttle

- `debounce: number` waits until inputs are quiet for the specified milliseconds.
- `throttle: number` skips executions until the interval has elapsed; the latest change runs once the window closes.

```ts
asyncEffect(
  async () => {
    await saveDraft(documentId.get(), draftBody.get());
  },
  [draftBody],
  { debounce: 500 },
);
```

Combine `debounce` and `abortable` to cancel in-flight saves when the user keeps typing.

## Retry Strategies

`retries` controls how many times VoltX should re-run the effect after it throws.
`retryDelay` adds a pause between attempts. Use `onError` for custom logging or to expose a manual `retry()` hook.

```ts
asyncEffect(
  async () => {
    const res = await fetch("/api/profile");
    if (!res.ok) throw new Error("Request failed");
    profile.set(await res.json());
  },
  [refreshToken],
  {
    retries: 3,
    retryDelay: 1000,
    onError(error, retry) {
      toast.error(error.message);
      retry(); // optionally kick off another attempt immediately
    },
  },
);
```

## Cleanup and disposal

Hold on to the disposer returned by `asyncEffect` when you need to stop reacting:

```ts
const stop = asyncEffect(async () => {
  const subscription = await openStream();
  return () => subscription.close();
}, [channel]);

window.addEventListener("beforeunload", stop);
```

VoltX automatically runs the cleanup when dependencies change, when the effect retries successfully, and when you call the disposer.

## Tips

- Keep the dependency list stable & wrap derived values in computeds if necessary.
- Throw errors from the effect body to trigger retries or the `onError` callback.
- Prefer `debounce` for text inputs and `throttle` for scroll/resize signals.
- Always check abort signals before committing expensive results when `abortable` is enabled.
