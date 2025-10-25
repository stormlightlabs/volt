/**
 * Charge system (bootstrap) for auto-discovery and initialization of Volt roots
 *
 * Handles declarative state initialization via data-volt-state and data-volt-computed
 */

import type { ChargedRoot, ChargeResult, Scope } from "$types/volt";
import { mount } from "./binder";
import { report } from "./error";
import { evaluate } from "./evaluator";
import { getComputedAttributes, isNil } from "./shared";
import { computed, signal } from "./signal";
import { registerStore } from "./store";

/**
 * Discover and mount all Volt roots in the document.
 *
 * Parses data-volt-state for initial state and data-volt-computed for derived values.
 * Also parses declarative global store from script[data-volt-store] elements.
 *
 * @param rootSelector - Selector for root elements (default: "[data-volt]")
 * @returns ChargeResult containing mounted roots and cleanup function
 *
 * @example
 * ```html
 * <!-- Global store (declarative) -->
 * <script type="application/json" data-volt-store>
 * {
 *   "theme": "dark",
 *   "user": { "name": "Alice" }
 * }
 * </script>
 *
 * <div data-volt data-volt-state='{"count": 0}' data-volt-computed:double="count * 2">
 *   <p data-volt-text="count"></p>
 *   <p data-volt-text="double"></p>
 *   <p data-volt-text="$store.theme"></p>
 * </div>
 * ```
 *
 * ```ts
 * const { cleanup } = charge();
 * // Later: cleanup() to unmount all
 * ```
 */
export function charge(rootSelector = "[data-volt]"): ChargeResult {
  parseDeclarativeStore();

  const elements = document.querySelectorAll(rootSelector);
  const chargedRoots: ChargedRoot[] = [];

  for (const element of elements) {
    try {
      const scope = createScopeFromElement(element);
      const cleanup = mount(element, scope);

      chargedRoots.push({ element, scope, cleanup });
    } catch (error) {
      report(error as Error, { source: "charge", element: element as HTMLElement });
    }
  }

  return {
    roots: chargedRoots,
    cleanup: () => {
      for (const root of chargedRoots) {
        try {
          root.cleanup();
        } catch (error) {
          report(error as Error, { source: "charge", element: root.element as HTMLElement });
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
        report(new Error(`data-volt-state must be a JSON object, got ${typeof stateData}`), {
          source: "charge",
          element: el as HTMLElement,
          directive: "data-volt-state",
          expression: stateAttr,
        });
      } else {
        for (const [key, value] of Object.entries(stateData)) {
          scope[key] = signal(value);
        }
      }
    } catch (error) {
      report(error as Error, {
        source: "charge",
        element: el as HTMLElement,
        directive: "data-volt-state",
        expression: stateAttr,
      });
    }
  }

  const computedAttrs = getComputedAttributes(el);
  for (const [name, expression] of computedAttrs) {
    try {
      scope[name] = computed(() => evaluate(expression, scope));
    } catch (error) {
      report(error as Error, {
        source: "charge",
        element: el as HTMLElement,
        directive: `data-volt-computed:${name}`,
        expression: expression,
      });
    }
  }

  return scope;
}

/**
 * Parse and register global store from declarative script tags.
 *
 * Looks for: <script type="application/json" data-volt-store>
 * Expects JSON object with key-value pairs to register in global store.
 */
function parseDeclarativeStore(): void {
  const scripts = document.querySelectorAll("script[data-volt-store][type=\"application/json\"]");

  for (const script of scripts) {
    try {
      const content = script.textContent?.trim();
      if (!content) continue;

      const data = JSON.parse(content);

      if (typeof data !== "object" || isNil(data) || Array.isArray(data)) {
        report(new Error(`data-volt-store script must contain a JSON object, got: ${typeof data}`), {
          source: "charge",
          element: script as HTMLElement,
          directive: "data-volt-store",
        });
        continue;
      }

      registerStore(data);
    } catch (error) {
      report(error as Error, { source: "charge", element: script as HTMLElement, directive: "data-volt-store" });
    }
  }
}
