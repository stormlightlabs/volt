/**
 * Server-Side Rendering (SSR) and hydration support for Volt.js
 *
 * Provides utilities for serializing scope state, embedding it in HTML,
 * and hydrating client-side without re-rendering.
 */

import type { Nullable } from "$types/helpers";
import type { HydrateOptions, HydrateResult, Scope, SerializedScope } from "$types/volt";
import { mount } from "./binder";
import { evaluate, extractDeps } from "./evaluator";
import { getComputedAttributes, isSignal } from "./shared";
import { computed, signal } from "./signal";

/**
 * Serialize a scope object to JSON for embedding in server-rendered HTML
 *
 * Converts all signals in the scope to their plain values.
 * Computed signals are serialized as their current values.
 *
 * @param scope - The reactive scope to serialize
 * @returns JSON string representing the scope state
 *
 * @example
 * ```ts
 * const scope = {
 *   count: signal(0),
 *   double: computed(() => scope.count.get() * 2, [scope.count])
 * };
 * const json = serializeScope(scope);
 * // Returns: '{"count":0,"double":0}'
 * ```
 */
export function serializeScope(scope: Scope): string {
  const serialized: SerializedScope = {};

  for (const [key, value] of Object.entries(scope)) {
    if (isSignal(value)) {
      serialized[key] = value.get();
    } else {
      serialized[key] = value;
    }
  }

  return JSON.stringify(serialized);
}

/**
 * Deserialize JSON state data back into a reactive scope
 *
 * Recreates signals from plain values. Does not recreate computed signals
 * (those should be redefined with data-volt-computed attributes).
 *
 * @param data - Plain object with state values
 * @returns Reactive scope with signals
 *
 * @example
 * ```ts
 * const scope = deserializeScope({ count: 42, name: "Alice" });
 * // Returns: { count: signal(42), name: signal("Alice") }
 * ```
 */
export function deserializeScope(data: SerializedScope): Scope {
  const scope: Scope = {};

  for (const [key, value] of Object.entries(data)) {
    scope[key] = signal(value);
  }

  return scope;
}

/**
 * Check if an element has already been hydrated
 *
 * @param el - Element to check
 * @returns True if element is marked as hydrated
 */
export function isHydrated(el: Element): boolean {
  return el.hasAttribute("data-volt-hydrated");
}

/**
 * Mark an element as hydrated to prevent double-hydration
 *
 * @param el - Element to mark
 */
function markHydrated(el: Element): void {
  el.setAttribute("data-volt-hydrated", "true");
}

/**
 * Check if an element has server-rendered state embedded
 *
 * Looks for a script tag with id="volt-state-{element-id}" containing JSON state.
 *
 * @param el - Element to check
 * @returns True if serialized state is found
 */
export function isServerRendered(el: Element): boolean {
  return getSerializedState(el) !== null;
}

/**
 * Extract serialized state from a server-rendered element
 *
 * Searches for a `<script type="application/json" id="volt-state-{id}">` tag
 * containing the serialized scope data.
 *
 * @param el - Root element to extract state from
 * @returns Parsed state object, or null if not found
 *
 * @example
 * ```html
 * <div id="app" data-volt>
 *   <script type="application/json" id="volt-state-app">
 *     {"count": 42}
 *   </script>
 * </div>
 * ```
 */
export function getSerializedState(el: Element): Nullable<SerializedScope> {
  const elementId = el.id;
  if (!elementId) {
    return null;
  }

  const scriptId = `volt-state-${elementId}`;
  const scriptTag = el.querySelector(`script[type="application/json"]#${scriptId}`);

  if (!scriptTag || !scriptTag.textContent) {
    return null;
  }

  try {
    return JSON.parse(scriptTag.textContent) as SerializedScope;
  } catch (error) {
    console.error(`Failed to parse serialized state from #${scriptId}:`, error);
    return null;
  }
}

/**
 * Create a reactive scope from element, preferring server-rendered state
 *
 * This is similar to createScopeFromElement in charge.ts, but checks for
 * server-rendered state first before falling back to data-volt-state.
 *
 * @param el - The root element
 * @returns Reactive scope object with signals
 */
function createHydrationScope(el: Element): Scope {
  let scope: Scope = {};

  const serializedState = getSerializedState(el);
  if (serializedState) {
    scope = deserializeScope(serializedState);
  } else {
    const stateAttr = (el as HTMLElement).dataset.voltState;
    if (stateAttr) {
      try {
        const stateData = JSON.parse(stateAttr);

        if (typeof stateData !== "object" || stateData === null || Array.isArray(stateData)) {
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
  }

  const computedAttrs = getComputedAttributes(el);
  for (const [name, expression] of computedAttrs) {
    try {
      const dependencies = extractDeps(expression, scope);
      scope[name] = computed(() => evaluate(expression, scope), dependencies);
    } catch (error) {
      console.error(`Failed to create computed "${name}" with expression "${expression}":`, error);
    }
  }

  return scope;
}

/**
 * Hydrate server-rendered Volt roots without re-rendering
 *
 * Similar to charge(), but designed for server-rendered content.
 * Preserves existing DOM structure and only attaches reactive bindings.
 *
 * @param options - Hydration options
 * @returns HydrateResult containing mounted roots and cleanup function
 *
 * @example
 * Server renders:
 * ```html
 * <div id="app" data-volt>
 *   <script type="application/json" id="volt-state-app">
 *     {"count": 0}
 *   </script>
 *   <p data-volt-text="count">0</p>
 * </div>
 * ```
 *
 * Client hydrates:
 * ```ts
 * const { cleanup } = hydrate();
 * // DOM is preserved, bindings are attached
 * ```
 */
export function hydrate(options: HydrateOptions = {}): HydrateResult {
  const { rootSelector = "[data-volt]", skipHydrated = true } = options;

  const elements = document.querySelectorAll(rootSelector);
  const chargedRoots: Array<{ element: Element; scope: Scope; cleanup: () => void }> = [];

  for (const element of elements) {
    if (skipHydrated && isHydrated(element)) {
      continue;
    }

    try {
      const scope = createHydrationScope(element);
      const cleanup = mount(element, scope);

      markHydrated(element);
      chargedRoots.push({ element, scope, cleanup });
    } catch (error) {
      console.error("Error hydrating Volt root:", element, error);
    }
  }

  return {
    roots: chargedRoots,
    cleanup: () => {
      for (const root of chargedRoots) {
        try {
          root.cleanup();
        } catch (error) {
          console.error("Error cleaning up hydrated Volt root:", root.element, error);
        }
      }
    },
  };
}
