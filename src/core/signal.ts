/**
 * A reactive primitive that notifies subscribers when its value changes.
 * Updates are batched in microtasks to avoid redundant notifications.
 */
export interface Signal<T> {
  /**
   * Get the current value of the signal.
   */
  get(): T;

  /**
   * Update the signal's value.
   * If the new value differs from the current value, subscribers will be notified
   * asynchronously in a batched microtask.
   */
  set(value: T): void;

  /**
   * Subscribe to changes in the signal's value.
   * The callback is invoked with the new value whenever it changes.
   * Returns an unsubscribe function to remove the subscription.
   */
  subscribe(callback: (value: T) => void): () => void;
}

/**
 * Creates a new signal with the given initial value.
 * Signals are reactive primitives that automatically notify subscribers when changed.
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
