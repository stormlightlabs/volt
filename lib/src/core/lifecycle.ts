/**
 * Global lifecycle hook system for Volt.js
 * Provides beforeMount, afterMount, beforeUnmount, and afterUnmount hooks
 */

import type { GlobalHookName, MountHookCallback, Scope, UnmountHookCallback } from "$types/volt";

/**
 * Global lifecycle hooks registry
 */
const lifecycleHooks = new Map<GlobalHookName, Set<MountHookCallback | UnmountHookCallback>>([
  ["beforeMount", new Set()],
  ["afterMount", new Set()],
  ["beforeUnmount", new Set()],
  ["afterUnmount", new Set()],
]);

/**
 * Register a global lifecycle hook.
 * Global hooks run for every mount/unmount operation in the application.
 *
 * @param name - Name of the lifecycle hook
 * @param cb - Callback function to execute
 * @returns Unregister function
 *
 * @example
 * // Log every mount operation
 * registerGlobalHook('beforeMount', (root, scope) => {
 *   console.log('Mounting', root, 'with scope', scope);
 * });
 *
 * @example
 * // Track mounted elements
 * const mountedElements = new Set<Element>();
 * registerGlobalHook('afterMount', (root) => {
 *   mountedElements.add(root);
 * });
 * registerGlobalHook('beforeUnmount', (root) => {
 *   mountedElements.delete(root);
 * });
 */
export function registerGlobalHook(name: GlobalHookName, cb: MountHookCallback | UnmountHookCallback): () => void {
  const hooks = lifecycleHooks.get(name);
  if (!hooks) {
    throw new Error(`Unknown lifecycle hook: ${name}`);
  }

  hooks.add(cb);

  return () => {
    hooks.delete(cb);
  };
}

/**
 * Unregister a global lifecycle hook.
 *
 * @param name - Name of the lifecycle hook
 * @param cb - Callback function to remove
 * @returns true if the hook was removed, false if it wasn't registered
 */
export function unregisterGlobalHook(name: GlobalHookName, cb: MountHookCallback | UnmountHookCallback): boolean {
  const hooks = lifecycleHooks.get(name);
  if (!hooks) {
    return false;
  }

  return hooks.delete(cb);
}

/**
 * Clear all global hooks for a specific lifecycle event.
 *
 * @param name - Name of the lifecycle hook to clear
 */
export function clearGlobalHooks(name: GlobalHookName): void {
  const hooks = lifecycleHooks.get(name);
  if (hooks) {
    hooks.clear();
  }
}

export function clearAllGlobalHooks(): void {
  for (const hooks of lifecycleHooks.values()) {
    hooks.clear();
  }
}

/**
 * Get all registered hooks for a specific lifecycle event.
 * Used internally by the binder system.
 *
 * @param name - Name of the lifecycle hook
 * @returns Array of registered callbacks
 */
export function getGlobalHooks(name: GlobalHookName): Array<MountHookCallback | UnmountHookCallback> {
  const hooks = lifecycleHooks.get(name);
  return hooks ? [...hooks] : [];
}

/**
 * Execute all registered hooks for a lifecycle event.
 * Used internally by the binder system.
 *
 * @param hookName - Name of the lifecycle hook to execute
 * @param root - The root element being mounted/unmounted
 * @param scope - The scope object (only for mount hooks)
 */
export function executeGlobalHooks(hookName: GlobalHookName, root: Element, scope?: Scope): void {
  const hooks = lifecycleHooks.get(hookName);
  if (!hooks || hooks.size === 0) {
    return;
  }

  for (const callback of hooks) {
    try {
      if (hookName === "beforeMount" || hookName === "afterMount") {
        if (scope !== undefined) {
          (callback as MountHookCallback)(root, scope);
        }
      } else {
        (callback as UnmountHookCallback)(root);
      }
    } catch (error) {
      console.error(`Error in global ${hookName} hook:`, error);
    }
  }
}

/**
 * Element-level lifecycle tracking for per-element hooks
 */
type ElementLifecycleState = {
  isMounted: boolean;
  bindings: Set<string>;
  onMount: Set<() => void>;
  onUnmount: Set<() => void>;
};

const elementLifecycleStates = new WeakMap<Element, ElementLifecycleState>();

/**
 * Get or create lifecycle state for an element.
 *
 * @param element - The element to track
 * @returns The lifecycle state object
 */
function getElementLifecycleState(element: Element): ElementLifecycleState {
  let state = elementLifecycleStates.get(element);
  if (!state) {
    state = { isMounted: false, bindings: new Set(), onMount: new Set(), onUnmount: new Set() };
    elementLifecycleStates.set(element, state);
  }
  return state;
}

/**
 * Register a per-element lifecycle hook.
 * These hooks are specific to individual elements.
 *
 * @param element - The element to attach the hook to
 * @param hookType - Type of hook ('mount' or 'unmount')
 * @param cb - Callback to execute
 */
export function registerElementHook(element: Element, hookType: "mount" | "unmount", cb: () => void): void {
  const state = getElementLifecycleState(element);

  if (hookType === "mount") {
    state.onMount.add(cb);
  } else {
    state.onUnmount.add(cb);
  }
}

/**
 * Notify that an element has been mounted.
 * Executes all registered onMount callbacks for the element.
 *
 * @param element - The mounted element
 */
export function notifyElementMounted(element: Element): void {
  const state = getElementLifecycleState(element);

  if (state.isMounted) {
    return;
  }

  state.isMounted = true;

  for (const callback of state.onMount) {
    try {
      callback();
    } catch (error) {
      console.error("Error in element onMount hook:", error);
    }
  }
}

/**
 * Notify that an element is being unmounted.
 * Executes all registered onUnmount callbacks for the element.
 *
 * @param element - The element being unmounted
 */
export function notifyElementUnmounted(element: Element): void {
  const state = getElementLifecycleState(element);

  if (!state.isMounted) {
    return;
  }

  state.isMounted = false;

  for (const callback of state.onUnmount) {
    try {
      callback();
    } catch (error) {
      console.error("Error in element onUnmount hook:", error);
    }
  }

  elementLifecycleStates.delete(element);
}

/**
 * Notify that a binding has been created on an element.
 *
 * @param element - The element the binding is on
 * @param name - Name of the binding (e.g., 'text', 'class', 'on-click')
 */
export function notifyBindingCreated(element: Element, name: string): void {
  const state = getElementLifecycleState(element);
  state.bindings.add(name);
}

/**
 * Notify that a binding has been destroyed on an element.
 *
 * @param element - The element the binding was on
 * @param name - Name of the binding
 */
export function notifyBindingDestroyed(element: Element, name: string): void {
  const state = elementLifecycleStates.get(element);
  if (state) {
    state.bindings.delete(name);
  }
}

/**
 * Check if an element is currently mounted.
 *
 * @param element - The element to check
 * @returns true if the element is mounted
 */
export function isElementMounted(element: Element): boolean {
  const state = elementLifecycleStates.get(element);
  return state?.isMounted ?? false;
}

/**
 * Get all bindings on an element.
 *
 * @param element - The element to query
 * @returns Array of binding names
 */
export function getElementBindings(element: Element): string[] {
  const state = elementLifecycleStates.get(element);
  return state ? [...state.bindings] : [];
}
