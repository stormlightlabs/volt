/**
 * Global reactive store for cross-scope state management
 *
 * The store holds signals that are accessible from any scope via $store.
 * Supports both programmatic registration and declarative initialization.
 */

import type { Optional } from "$types/helpers";
import type { GlobalStore, Signal } from "$types/volt";
import { signal } from "./signal";

/**
 * Internal signal registry for the global store
 */
const storeSignals = new Map<string, Signal<unknown>>();

/**
 * Global store singleton with helper methods and direct signal access
 */
const store: GlobalStore = {
  _signals: storeSignals,

  get<T = unknown>(key: string): Optional<T> {
    const sig = storeSignals.get(key);
    return sig ? (sig.get() as T) : undefined;
  },

  set<T = unknown>(key: string, value: T): void {
    const sig = storeSignals.get(key);
    if (sig) {
      sig.set(value);
    } else {
      storeSignals.set(key, signal(value));
    }
  },

  has(key: string): boolean {
    return storeSignals.has(key);
  },
};

/**
 * Register state in the global store.
 *
 * Accepts either:
 * - An object of signals: { theme: signal('dark') }
 * - An object of values: { count: 0 } (auto-wrapped in signals)
 *
 * @param state - Object containing signals or raw values to register globally
 *
 * @example
 * ```ts
 * // With signals
 * registerStore({
 *   theme: signal('dark'),
 *   user: signal({ name: 'Alice' })
 * });
 *
 * // With raw values (auto-wrapped)
 * registerStore({
 *   count: 0,
 *   isLoggedIn: false
 * });
 * ```
 */
export function registerStore(state: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(state)) {
    if (value && typeof value === "object" && "get" in value && "set" in value && "subscribe" in value) {
      storeSignals.set(key, value as Signal<unknown>);
      Object.defineProperty(store, key, { get: () => value, enumerable: true, configurable: true });
    } else {
      const sig = signal(value);
      storeSignals.set(key, sig);
      Object.defineProperty(store, key, { get: () => sig, enumerable: true, configurable: true });
    }
  }
}

/**
 * Get the global store instance.
 *
 * The store provides:
 * - Direct signal access: `$store.theme` returns the signal
 * - Helper methods: `$store.get('theme')` returns the unwrapped value
 * - Signal creation: `$store.set('newKey', value)` creates a new signal
 *
 * @returns The global store singleton
 *
 * @example
 * ```ts
 * const store = getStore();
 *
 * // Access signal directly
 * const themeSignal = store.theme;
 *
 * // Get unwrapped value
 * const currentTheme = store.get('theme');
 *
 * // Set value (creates signal if doesn't exist)
 * store.set('theme', 'light');
 * ```
 */
export function getStore(): GlobalStore {
  return store;
}
