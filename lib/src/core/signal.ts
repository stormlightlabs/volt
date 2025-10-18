import type { ComputedSignal, Signal } from "$types/volt";

/**
 * Creates a new signal with the given initial value.
 *
 * @param initialValue - The initial value of the signal
 * @returns A Signal object with get, set, and subscribe methods
 *
 * @example
 * const count = signal(0);
 * count.subscribe(value => console.log('Count:', value));
 * count.set(1); // Logs: Count: 1
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  const notify = () => {
    for (const callback of subscribers) {
      try {
        callback(value);
      } catch (error) {
        console.error("Error in signal subscriber:", error);
      }
    }
  };

  return {
    get() {
      return value;
    },

    set(newValue: T) {
      if (value === newValue) {
        return;
      }

      value = newValue;
      notify();
    },

    subscribe(callback: (value: T) => void) {
      subscribers.add(callback);

      return () => {
        subscribers.delete(callback);
      };
    },
  };
}

/**
 * Creates a computed signal that derives its value from other signals.
 * The computation function is re-run whenever any of its dependencies change.
 *
 * @param compute - Function that computes the derived value
 * @param dependencies - Array of signals this computation depends on
 * @returns A ComputedSignal with get and subscribe methods
 *
 * @example
 * const count = signal(5);
 * const doubled = computed(() => count.get() * 2, [count]);
 * doubled.get(); // 10
 * count.set(10);
 * doubled.get(); // 20
 */
export function computed<T>(
  compute: () => T,
  dependencies: Array<Signal<unknown> | ComputedSignal<unknown>>,
): ComputedSignal<T> {
  let value = compute();
  const subscribers = new Set<(value: T) => void>();

  const notify = () => {
    for (const callback of subscribers) {
      try {
        callback(value);
      } catch (error) {
        console.error("Error in computed subscriber:", error);
      }
    }
  };

  const recompute = () => {
    const newValue = compute();
    if (value !== newValue) {
      value = newValue;
      notify();
    }
  };

  for (const dependency of dependencies) {
    dependency.subscribe(recompute);
  }

  return {
    get() {
      return value;
    },

    subscribe(callback: (value: T) => void) {
      subscribers.add(callback);

      return () => {
        subscribers.delete(callback);
      };
    },
  };
}

/**
 * Creates a side effect that runs when dependencies change.
 *
 * @param effectFunction - Function to run as a side effect
 * @param dependencies - Array of signals this effect depends on
 * @returns Cleanup function to stop the effect
 *
 * @example
 * const count = signal(0);
 * const cleanup = effect(() => {
 *   console.log('Count changed:', count.get());
 * }, [count]);
 */
export function effect(
  effectFunction: () => void | (() => void),
  dependencies: Array<Signal<unknown> | ComputedSignal<unknown>>,
): () => void {
  let cleanup: (() => void) | void;

  const runEffect = () => {
    if (cleanup) {
      cleanup();
    }
    try {
      cleanup = effectFunction();
    } catch (error) {
      console.error("Error in effect:", error);
    }
  };

  runEffect();

  const unsubscribers = dependencies.map((dependency) => dependency.subscribe(runEffect));

  return () => {
    if (cleanup) {
      cleanup();
    }
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
