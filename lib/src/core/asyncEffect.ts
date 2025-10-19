/**
 * Async effect system with abort, race protection, debounce, throttle, and error handling
 */

import type { Optional, Timer } from "$types/helpers";
import type { AsyncEffectFunction, AsyncEffectOptions, ComputedSignal, Signal } from "$types/volt";

/**
 * Creates an async side effect that runs when dependencies change.
 * Supports abort signals, race protection, debouncing, throttling, and error handling.
 *
 * @param effectFunction - Async function to run as a side effect
 * @param dependencies - Array of signals this effect depends on
 * @param options - Configuration options for async behavior
 * @returns Cleanup function to stop the effect
 *
 * @example
 * // Fetch with abort on cleanup
 * const query = signal('');
 * const cleanup = asyncEffect(async (signal) => {
 *   const response = await fetch(`/api/search?q=${query.get()}`, { signal });
 *   const data = await response.json();
 *   results.set(data);
 * }, [query], { abortable: true });
 *
 * @example
 * // Debounced search
 * asyncEffect(async () => {
 *   const response = await fetch(`/api/search?q=${searchQuery.get()}`);
 *   results.set(await response.json());
 * }, [searchQuery], { debounce: 300 });
 *
 * @example
 * // Error handling with retries
 * asyncEffect(async () => {
 *   const response = await fetch('/api/data');
 *   if (!response.ok) throw new Error('Failed to fetch');
 *   data.set(await response.json());
 * }, [refreshTrigger], {
 *   retries: 3,
 *   retryDelay: 1000,
 *   onError: (error, retry) => {
 *     console.error('Fetch failed:', error);
 *     // Optionally call retry() to retry immediately
 *   }
 * });
 */
export function asyncEffect(
  effectFunction: AsyncEffectFunction,
  dependencies: Array<Signal<unknown> | ComputedSignal<unknown>>,
  options: AsyncEffectOptions = {},
): () => void {
  const { abortable = false, debounce, throttle, onError, retries = 0, retryDelay = 0 } = options;

  let cleanup: (() => void) | void;
  let abortController: Optional<AbortController>;
  let executionId = 0;
  let debounceTimer: Optional<Timer>;
  let throttleTimer: Optional<Timer>;
  let lastExecutionTime = 0;
  let pendingExecution = false;
  let retryCount = 0;

  /**
   * Execute the async effect with error handling and retries
   */
  const executeEffect = async (currentExecutionId: number) => {
    if (abortController) {
      abortController.abort();
    }

    if (cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error("Error in async effect cleanup:", error);
      }
      cleanup = undefined;
    }

    if (abortable) {
      abortController = new AbortController();
    }

    try {
      const result = await effectFunction(abortController?.signal);

      if (currentExecutionId !== executionId) {
        return;
      }

      if (typeof result === "function") {
        cleanup = result;
      }

      retryCount = 0;
    } catch (error) {
      if (currentExecutionId !== executionId) {
        return;
      }

      if (abortController?.signal.aborted) {
        return;
      }

      const err = error instanceof Error ? error : new Error(String(error));

      if (retryCount < retries) {
        retryCount++;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }

        if (currentExecutionId === executionId) {
          await executeEffect(currentExecutionId);
        }
      } else {
        console.error("Error in async effect:", err);

        if (onError) {
          const retry = () => {
            retryCount = 0;
            scheduleExecution();
          };
          onError(err, retry);
        }
      }
    }
  };

  /**
   * Schedule effect execution with debounce/throttle logic
   */
  const scheduleExecution = () => {
    const currentExecutionId = ++executionId;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }

    if (debounce !== undefined && debounce > 0) {
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        executeEffect(currentExecutionId);
      }, debounce);
      return;
    }

    if (throttle !== undefined && throttle > 0) {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecutionTime;

      if (timeSinceLastExecution >= throttle) {
        lastExecutionTime = now;
        executeEffect(currentExecutionId);
      } else if (!pendingExecution) {
        pendingExecution = true;
        const remainingTime = throttle - timeSinceLastExecution;

        throttleTimer = setTimeout(() => {
          throttleTimer = undefined;
          pendingExecution = false;
          lastExecutionTime = Date.now();
          executeEffect(currentExecutionId);
        }, remainingTime);
      }
      return;
    }

    executeEffect(currentExecutionId);
  };

  scheduleExecution();

  const unsubscribers = dependencies.map((dependency) =>
    dependency.subscribe(() => {
      scheduleExecution();
    })
  );

  return () => {
    executionId++;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }

    if (throttleTimer) {
      clearTimeout(throttleTimer);
      throttleTimer = undefined;
    }

    if (abortController) {
      abortController.abort();
      abortController = undefined;
    }

    if (cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error("Error during async effect unmount:", error);
      }
      cleanup = undefined;
    }

    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
