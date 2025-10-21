# Async Effect Internals

`asyncEffect` orchestrates asynchronous work that reacts to signals.
It combines the signal subscription model with scheduling helpers (debounce/throttle), abort signals, retries, and cleanup delivery.
The implementation lives in `lib/src/core/async-effect.ts`.

## Execution lifecycle

1. **Subscription** - Each dependency signal registers `scheduleExecution` with `subscribe()`.
    The effect runs immediately on creation and whenever any dependency changes.
2. **Scheduling** - `scheduleExecution` increments a monotonic `executionId`, then applies debounce or throttle rules before invoking `executeEffect`.
3. **Abort + cleanup** - The previous cleanup function (if any) runs before each new execution.
    When `abortable` is true, a shared `AbortController` is aborted prior to cleanup and replaced for the upcoming run.
4. **Effect body** - The async callback receives the optional `AbortSignal`.
    It may return a cleanup function (sync or async).
    VoltX stores it so future runs can dispose the previous work.
5. **Race protection** - The awaited result checks whether its `executionId` still matches the global counter.
    If dependencies changed mid-flight, the run is considered stale and discarded.
6. **Retry loop** - Errors increment a `retryCount`.
    While the counter is below `retries`, the effect waits for `retryDelay` (if provided) and reruns the same `executionId`.
    Once retries are exhausted VoltX logs the failure and, when `onError` is defined, passes the error alongside a `retry()` callback that resets the counter and schedules a new run.

## Scheduling helpers

- **Debounce** clears and reuses a `setTimeout`, delaying execution until changes stop for `opts.debounce` (in ms).
- **Throttle** tracks the last execution timestamp.
    If the window has not expired it schedules a timer to run later and flips `pendingExecution` so only one trailing invocation is queued.
- Both helpers coexist with abort support: any timer-driven execution aborts the previous run before invoking the effect body.

## Cleanup guarantees

- Returning a function from the effect body registers it as the cleanup for the next iteration.
- Abortable effects tip off downstream code through the `AbortSignal`, but cleanup functions still run even if the consumer ignores the signal.
- Disposing the effect (via the returned function) aborts active requests, runs cleanup once, clears pending timers, and unsubscribes from every dependency.

## Error handling nuances

- All cleanup functions are wrapped in try/catch to avoid crashing the reactive loop.
- Retry delays use `setTimeout` so they respect fake timers in Vitest.
- Stale retries bail immediately if the global `executionId` has advanced, preventing duplicate work after rapid dependency changes.

## Testing Surface

`lib/test/core/async-effect.test.ts` covers:

- Immediate execution and dependency reactivity.
- Cleanup semantics and disposal.
- Abort controller wiring (abort on change, abort on dispose).
- Race protection to ensure stale responses are ignored.
- Debounce and throttle behavior.
- Retry loops, `onError` callbacks, and manual retry invocation.

These tests rely on fake timers, so implementation details intentionally avoid microtasks for debounce/throttle, favoring `setTimeout` to keep deterministic control over scheduling.
