/**
 * Special scope variables ($pulse, $uid, $arc, $probe)
 *
 * Factory functions for creating the special `$` variables that are injected into scopes.
 * These provide runtime utilities accessible in expressions and event handlers.
 */

import type { ArcFunction, CleanupFunction, ProbeFunction, PulseFunction, Scope, UidFunction } from "$types/volt";
import { evaluate } from "./evaluator";
import { incrementUidCounter } from "./scope-metadata";
import { extractDeps } from "./shared";

/**
 * Create the $pulse function for deferring execution to next microtask.
 *
 * $pulse() schedules a callback to run after the current execution context completes,
 * ensuring that DOM updates have been applied before the callback runs.
 *
 * @returns The $pulse function
 *
 * @example
 * ```html
 * <button data-volt-on-click="count++; $pulse(() => console.log('DOM updated'))">
 *   Increment
 * </button>
 * ```
 */
export function createPulse(): PulseFunction {
  return (cb: () => void) => {
    queueMicrotask(cb);
  };
}

/**
 * Create the $uid function for generating unique, deterministic IDs within a scope.
 *
 * Each call increments a counter specific to the scope, ensuring IDs are unique
 * within that scope and deterministic across renders.
 *
 * @param scope - The reactive scope
 * @returns The $uid function
 *
 * @example
 * ```html
 * <input data-volt-bind:id="$uid('field')" />
 * <!-- Generates: "volt-field-1", "volt-field-2", etc. -->
 * ```
 */
export function createUid(scope: Scope): UidFunction {
  return (prefix?: string) => {
    const counter = incrementUidCounter(scope);
    return prefix ? `volt-${prefix}-${counter}` : `volt-${counter}`;
  };
}

/**
 * Create the $arc function for dispatching CustomEvents from an element.
 *
 * $arc() provides a simple way to emit custom events with optional detail data.
 * The event bubbles by default and can be caught by parent elements.
 *
 * @param element - The element to dispatch events from
 * @returns The $arc function
 *
 * @example
 * ```html
 * <button data-volt-on-click="$arc('user:save', { id: userId })">
 *   Save
 * </button>
 *
 * <div data-volt-on-user:save="handleSave($event.detail)">
 *   <!-- Catches the custom event -->
 * </div>
 * ```
 */
export function createArc(element: Element): ArcFunction {
  return (eventName: string, detail?: unknown) => {
    const event = new CustomEvent(eventName, { detail, bubbles: true, composed: true, cancelable: true });
    element.dispatchEvent(event);
  };
}

/**
 * Create the $probe function for imperatively observing reactive expressions.
 *
 * $probe() creates an effect that watches an expression and calls a callback
 * whenever the expression's dependencies change. The callback is invoked immediately
 * with the initial value, then whenever any dependency changes.
 *
 * @param scope - The reactive scope
 * @returns The $probe function
 *
 * @example
 * ```html
 * <div data-volt-init="$probe('count', v => console.log('Count changed:', v))">
 *   <!-- Logs whenever count changes -->
 * </div>
 * ```
 */
export function createProbe(scope: Scope): ProbeFunction {
  return (expr: string, cb: (value: unknown) => void): CleanupFunction => {
    const unsubs: Array<() => void> = [];
    let isDisposed = false;

    const runProbe = () => {
      if (isDisposed) {
        return;
      }

      try {
        const value = evaluate(expr, scope);
        cb(value);
      } catch (error) {
        console.error("Error in $probe expression:", error);
      }
    };

    try {
      const deps = extractDeps(expr, scope);

      for (const dep of deps) {
        const unsubscribe = dep.subscribe(runProbe);
        unsubs.push(unsubscribe);
      }
    } catch (error) {
      console.error("Error extracting dependencies for $probe:", error);
    }

    runProbe();
    return () => {
      isDisposed = true;

      for (const unsub of unsubs) {
        try {
          unsub();
        } catch (error) {
          console.error("Error unsubscribing $probe:", error);
        }
      }
    };
  };
}
