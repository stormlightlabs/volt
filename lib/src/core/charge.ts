/**
 * Charge system (bootstrap) for auto-discovery and initialization of Volt roots
 *
 * Handles declarative state initialization via data-volt-state and data-volt-computed
 */

import type { ChargedRoot, ChargeResult, Scope } from "$types/volt";
import { mount } from "./binder";
import { evaluate } from "./evaluator";
import { getComputedAttributes, isNil } from "./shared";
import { computed, signal } from "./signal";

/**
 * Discover and mount all Volt roots in the document.
 * Parses data-volt-state for initial state and data-volt-computed for derived values.
 *
 * @param rootSelector - Selector for root elements (default: "[data-volt]")
 * @returns ChargeResult containing mounted roots and cleanup function
 *
 * @example
 * ```html
 * <div data-volt data-volt-state='{"count": 0}' data-volt-computed:double="count * 2">
 *   <p data-volt-text="count"></p>
 *   <p data-volt-text="double"></p>
 * </div>
 * ```
 *
 * ```ts
 * const { cleanup } = charge();
 * // Later: cleanup() to unmount all
 * ```
 */
export function charge(rootSelector = "[data-volt]"): ChargeResult {
  const elements = document.querySelectorAll(rootSelector);
  const chargedRoots: ChargedRoot[] = [];

  for (const element of elements) {
    try {
      const scope = createScopeFromElement(element);
      const cleanup = mount(element, scope);

      chargedRoots.push({ element, scope, cleanup });
    } catch (error) {
      console.error("Error charging Volt root:", element, error);
    }
  }

  return {
    roots: chargedRoots,
    cleanup: () => {
      for (const root of chargedRoots) {
        try {
          root.cleanup();
        } catch (error) {
          console.error("Error cleaning up Volt root:", root.element, error);
        }
      }
    },
  };
}

/**
 * Create a reactive scope from element's data-volt-state and data-volt-computed attributes
 */
function createScopeFromElement(el: Element): Scope {
  const scope: Scope = {};

  const stateAttr = (el as HTMLElement).dataset.voltState;
  if (stateAttr) {
    try {
      const stateData = JSON.parse(stateAttr);

      if (typeof stateData !== "object" || isNil(stateData) || Array.isArray(stateData)) {
        console.error(`data-volt-state must be a JSON object, got ${typeof stateData}:`, el);
      } else {
        for (const [key, value] of Object.entries(stateData)) {
          scope[key] = signal(value);
        }
      }
    } catch (error) {
      console.error("Failed to parse data-volt-state JSON:", stateAttr, error);
      console.error("Element:", el);
    }
  }

  const computedAttrs = getComputedAttributes(el);
  for (const [name, expression] of computedAttrs) {
    try {
      scope[name] = computed(() => evaluate(expression, scope));
    } catch (error) {
      console.error(`Failed to create computed "${name}" with expression "${expression}":`, error);
    }
  }

  return scope;
}
