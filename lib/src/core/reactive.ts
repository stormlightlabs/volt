/**
 * Deep reactive proxy system for objects and arrays.
 *
 * Uses JavaScript Proxies to create reactive objects where property access and mutations
 * automatically trigger updates. Internally uses signals for each property, created lazily
 * on first access.
 *
 * Unlike signal() which wraps a single value, reactive() creates a transparent proxy where
 * property access feels natural while maintaining reactivity.
 */

import type { Signal } from "$types/volt";
import { signal } from "./signal";
import { recordDep } from "./tracker";

/**
 * WeakMap to store the raw object for each reactive proxy.
 * Used by toRaw() to unwrap proxies.
 */
const reactiveToRaw = new WeakMap<object, object>();

/**
 * WeakMap to store the reactive proxy for each raw object.
 * Ensures we only create one proxy per object.
 */
const rawToReactive = new WeakMap<object, object>();

/**
 * WeakMap to store signals for each property of a reactive object.
 * Key is the target object, value is a Map of property name to signal.
 */
const targetToSignals = new WeakMap<object, Map<string | symbol, Signal<unknown>>>();

/**
 * Array methods that mutate the array and should trigger updates.
 */
const arrayMutators = new Set(["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"]);

/**
 * Check if a value is an object (not null, not primitive).
 */
function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

/**
 * Check if a value is already a reactive proxy.
 */
export function isReactive(value: unknown): boolean {
  return isObject(value) && reactiveToRaw.has(value);
}

/**
 * Get the raw (non-reactive) object from a reactive proxy.
 * If the value is not reactive, returns it as-is.
 */
export function toRaw<T>(value: T): T {
  if (!isObject(value)) {
    return value;
  }

  return (reactiveToRaw.get(value) as T) || value;
}

/**
 * Get or create a signal for a specific property on a reactive object.
 */
function getPropertySignal(target: object, key: string | symbol): Signal<unknown> {
  let signals = targetToSignals.get(target);

  if (!signals) {
    signals = new Map();
    targetToSignals.set(target, signals);
  }

  let sig = signals.get(key);

  if (!sig) {
    const initialValue = Reflect.get(target, key);
    sig = signal(initialValue);
    signals.set(key, sig);
  }

  return sig;
}

/**
 * Create a reactive proxy for an object or array.
 *
 * Property access and mutations are tracked automatically. Nested objects and arrays
 * are recursively wrapped in proxies for deep reactivity.
 *
 * @param target - The object or array to make reactive
 * @returns A reactive proxy of the target
 *
 * @example
 * const state = reactive({ count: 0, nested: { value: 1 } });
 * const doubled = computed(() => state.count * 2);
 * state.count++; // triggers recomputation of doubled
 * state.nested.value = 2; // also reactive
 */
export function reactive<T extends object>(target: T): T {
  if (!isObject(target)) {
    console.warn("[reactive] Can only make objects and arrays reactive, got:", typeof target);
    return target;
  }

  if (isReactive(target)) {
    return target;
  }

  const existingProxy = rawToReactive.get(target);
  if (existingProxy) {
    return existingProxy as T;
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      if (key === "__v_raw") {
        return target;
      }

      if (key === "__v_isReactive") {
        return true;
      }

      if (Array.isArray(target) && arrayMutators.has(key as string)) {
        return function(this: unknown[], ...args: unknown[]) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
          const method = Reflect.get(target, key) as Function;
          const oldLength = target.length;
          const result = method.apply(target, args);

          const newLength = target.length;
          const maxLength = Math.max(oldLength, newLength);

          for (let i = 0; i < maxLength; i++) {
            const sig = getPropertySignal(target, String(i));
            sig.set(Reflect.get(target, i));
          }

          if (oldLength !== newLength) {
            const lengthSig = getPropertySignal(target, "length");
            lengthSig.set(newLength);
          }

          return result;
        };
      }

      const sig = getPropertySignal(target, key);
      recordDep(sig);

      const value = Reflect.get(target, key, receiver);

      if (isObject(value)) {
        return reactive(value);
      }

      return sig.get();
    },

    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);

      const result = Reflect.set(target, key, value, receiver);

      if (oldValue !== value) {
        const sig = getPropertySignal(target, key);
        sig.set(value);
      }

      return result;
    },

    deleteProperty(target, key) {
      const hadKey = Reflect.has(target, key);
      const result = Reflect.deleteProperty(target, key);

      if (hadKey && result) {
        const sig = getPropertySignal(target, key);
        sig.set(undefined);
      }

      return result;
    },

    has(target, key) {
      const sig = getPropertySignal(target, key);
      recordDep(sig);

      return Reflect.has(target, key);
    },
  });

  reactiveToRaw.set(proxy, target);
  rawToReactive.set(target, proxy);

  return proxy as T;
}
