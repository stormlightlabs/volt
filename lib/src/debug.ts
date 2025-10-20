/**
 * Volt.js Debug Utilities
 *
 * Lazy-loadable debugging module for signal introspection and visualization.
 * Import from 'voltx.js/debug' to access these utilities without affecting production bundle size.
 *
 * @example
 * ```ts
 * import { debugSignal, debugComputed, logAllSignals } from 'voltx.js/debug';
 *
 * const count = debugSignal(0, 'count');
 * const doubled = debugComputed(() => count.get() * 2, 'doubled');
 *
 * logAllSignals();
 * ```
 *
 * @module voltx.js/debug
 * @packageDocumentation
 */

import { reactive as coreReactive } from "$core/reactive";
import { computed as coreComputed, signal as coreSignal } from "$core/signal";
import type { ComputedSignal, Signal, SignalType } from "$types/volt";
import {
  buildDependencyGraph,
  detectCircularDependencies,
  getDependencies,
  getDependents,
  getSignalDepth,
  recordDependencies,
} from "./debug/graph";
import {
  disableGlobalTracing,
  enableGlobalTracing,
  logAllReactives,
  logAllSignals,
  logReactive,
  logSignal,
  logSignalTable,
  trace,
  watch,
} from "./debug/logger";
import {
  clearRegistry,
  getAllReactives,
  getAllSignals,
  getReactiveInfo,
  getRegistryStats,
  getSignalInfo,
  nameReactive,
  nameSignal,
  registerReactive,
  registerSignal,
} from "./debug/registry";

/**
 * Create a signal with automatic debug registration.
 *
 * @param initialValue - The initial value
 * @param name - Optional name for debugging
 * @returns A Signal with debug metadata
 */
export function debugSignal<T>(initialValue: T, name?: string): Signal<T> {
  const sig = coreSignal(initialValue);
  registerSignal(sig, "signal", name);
  return sig;
}

/**
 * Create a computed signal with automatic debug registration.
 *
 * @param compute - Computation function
 * @param name - Optional name for debugging
 * @returns A ComputedSignal with debug metadata
 */
export function debugComputed<T>(compute: () => T, name?: string): ComputedSignal<T> {
  const comp = coreComputed(compute);
  registerSignal(comp, "computed", name);
  const deps = extractComputedDeps(comp);
  if (deps.length > 0) {
    recordDependencies(comp, deps);
  }
  return comp;
}

/**
 * Create a reactive object with automatic debug registration.
 *
 * @param target - The object or array to make reactive
 * @param name - Optional name for debugging
 * @returns A reactive proxy with debug metadata
 */
export function debugReactive<T extends object>(target: T, name?: string): T {
  const proxy = coreReactive(target);
  registerReactive(proxy, name);
  return proxy;
}

/**
 * Extract dependencies from a computed signal by running it in a tracking context.
 * This is a helper that uses the same tracking mechanism as the core.
 */
function extractComputedDeps(_comp: ComputedSignal<unknown>): Array<Signal<unknown> | ComputedSignal<unknown>> {
  // The computed has already run and subscribed to its dependencies
  // TODO: We need to access the internal dependency tracking
  return [];
}

export function attachDebugger(sig: Signal<unknown> | ComputedSignal<unknown>, type: SignalType, name?: string): void {
  registerSignal(sig, type, name);
}

export const vdebugger = {
  signal: debugSignal,
  computed: debugComputed,
  reactive: debugReactive,
  attach: attachDebugger,
  getAllSignals,
  getAllReactives,
  getSignalInfo,
  getReactiveInfo,
  getStats: getRegistryStats,
  nameSignal,
  nameReactive,
  getDependencies,
  getDependents,
  buildGraph: buildDependencyGraph,
  detectCycles: detectCircularDependencies,
  getDepth: getSignalDepth,
  log: logSignal,
  logReactive,
  logAll: logAllSignals,
  logAllReactives,
  logTable: logSignalTable,
  trace,
  watch,
  enableTracing: enableGlobalTracing,
  disableTracing: disableGlobalTracing,
  clear: clearRegistry,
};

export type { GraphNode, SignalMetadata, SignalType } from "$types/volt";
export { hasDependency } from "./debug/graph";
export {
  buildDependencyGraph,
  detectCircularDependencies,
  getDependencies,
  getDependents,
  getSignalDepth,
} from "./debug/graph";
export {
  disableGlobalTracing,
  enableGlobalTracing,
  logAllReactives,
  logAllSignals,
  logReactive,
  logSignal,
  logSignalTable,
  trace,
  watch,
} from "./debug/logger";
export {
  clearRegistry,
  getAllReactives,
  getAllSignals,
  getReactiveInfo,
  getReactiveMetadata,
  getRegistryStats,
  getSignalInfo,
  getSignalMetadata,
  nameReactive,
} from "./debug/registry";
export { nameSignal } from "./debug/registry";
