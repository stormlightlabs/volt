import type { ComputedSignal, Signal } from "$types/volt";
import { recordDep, startTracking, stopTracking } from "./tracker";

/**
 * Creates a new signal with the given initial value.
 *
 * Signals are reactive primitives that notify subscribers when their value changes.
 * When accessed inside a computed() or effect(), they are automatically tracked as dependencies.
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
    const snapshot = [...subscribers];
    for (const callback of snapshot) {
      try {
        callback(value);
      } catch (error) {
        console.error("Error in signal subscriber:", error);
      }
    }
  };

  const sig: Signal<T> = {
    get() {
      recordDep(sig);
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

  return sig;
}

/**
 * Creates a computed signal that derives its value from other signals.
 *
 * Dependencies are automatically tracked by detecting which signals are accessed
 * during the computation function execution. The computation is re-run whenever
 * any of its dependencies change.
 *
 * @param compute - Function that computes the derived value
 * @returns A ComputedSignal with get and subscribe methods
 *
 * @example
 * const count = signal(5);
 * const doubled = computed(() => count.get() * 2);
 * doubled.get(); // 10
 * count.set(10);
 * doubled.get(); // 20
 */
export function computed<T>(compute: () => T): ComputedSignal<T> {
  let value: T;
  let isInitialized = false;
  let isRecomputing = false;
  const subs = new Set<(value: T) => void>();
  const unsubscribers: Array<() => void> = [];

  const notify = () => {
    const snapshot = [...subs];
    for (const cb of snapshot) {
      try {
        cb(value);
      } catch (error) {
        console.error("Error in computed subscriber:", error);
      }
    }
  };

  const recompute = () => {
    if (isRecomputing) {
      throw new Error("Circular dependency detected in computed signal");
    }

    isRecomputing = true;
    let shouldNotify = false;

    try {
      for (const unsub of unsubscribers) {
        unsub();
      }
      unsubscribers.length = 0;

      startTracking(comp);
      try {
        const newValue = compute();

        if (!isInitialized || value !== newValue) {
          value = newValue;
          isInitialized = true;
          shouldNotify = subs.size > 0;
        }
      } catch (error) {
        console.error("Error in computed:", error);
        throw error;
      } finally {
        const deps = stopTracking();

        for (const dep of deps) {
          const unsub = dep.subscribe(recompute);
          unsubscribers.push(unsub);
        }
      }
    } finally {
      isRecomputing = false;
    }

    if (shouldNotify) {
      notify();
    }
  };

  const comp: ComputedSignal<T> = {
    get() {
      if (!isInitialized) {
        recompute();
      }

      recordDep(comp);
      return value;
    },

    subscribe(callback: (value: T) => void) {
      if (!isInitialized) {
        recompute();
      }

      subs.add(callback);

      return () => {
        subs.delete(callback);
      };
    },
  };

  return comp;
}

/**
 * Creates a side effect that runs when dependencies change.
 *
 * Dependencies are automatically tracked by detecting which signals are accessed
 * during the effect function execution. The effect is re-run whenever any of its
 * dependencies change.
 *
 * @param cb - Function to run as a side effect. Can return a cleanup function.
 * @returns Cleanup function to stop the effect
 *
 * @example
 * const count = signal(0);
 * const cleanup = effect(() => {
 *   console.log('Count changed:', count.get());
 * });
 */
export function effect(cb: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;
  const unsubscribers: Array<() => void> = [];
  let isDisposed = false;

  const runEffect = () => {
    if (isDisposed) {
      return;
    }

    for (const unsub of unsubscribers) {
      unsub();
    }
    unsubscribers.length = 0;

    if (cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error("Error in effect cleanup:", error);
      }
      cleanup = undefined;
    }

    startTracking();
    try {
      cleanup = cb();
    } catch (error) {
      console.error("Error in effect:", error);
    } finally {
      const deps = stopTracking();

      for (const dep of deps) {
        const unsub = dep.subscribe(runEffect);
        unsubscribers.push(unsub);
      }
    }
  };

  runEffect();

  return () => {
    isDisposed = true;

    if (cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error("Error in effect cleanup:", error);
      }
    }

    for (const unsubscribe of unsubscribers) {
      try {
        unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing effect:", error);
      }
    }
  };
}
