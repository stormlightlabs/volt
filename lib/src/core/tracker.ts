/**
 * Dependency tracking system for automatic signal dependency detection.
 *
 * Uses a stack-based tracking context to record signal accesses during computations.
 * When a computed signal or effect runs, it pushes a tracking context onto the stack.
 * Any signal.get() calls during execution are recorded as dependencies.
 */

import type { Dep } from "$types/volt";

/**
 * Holds the set of dependencies discovered during this tracking session and the source being tracked (to prevent cycles)
 */
type TrackingContext = { deps: Set<Dep>; source?: Dep };

/**
 * Global stack of active tracking contexts.
 * When nested computeds run, multiple contexts can be active simultaneously.
 */
const trackingStack: TrackingContext[] = [];

/**
 * Get the currently active tracking context, if any.
 */
function getActiveContext(): TrackingContext | undefined {
  return trackingStack.at(-1);
}

/**
 * Start tracking signal dependencies.
 * Should be called before executing a computation function.
 *
 * @param source - Optional source signal for cycle detection
 * @returns The tracking context
 */
export function startTracking(source?: Dep): TrackingContext {
  const context: TrackingContext = { deps: new Set(), source };

  trackingStack.push(context);
  return context;
}

/**
 * Stop tracking and return the collected dependencies.
 * Should be called after executing a computation function.
 *
 * @returns Array of signals that were accessed during tracking
 */
export function stopTracking(): Dep[] {
  const context = trackingStack.pop();
  if (!context) {
    console.warn("stopTracking called without matching startTracking");
    return [];
  }

  return [...context.deps];
}

/**
 * Record a signal access as a dependency.
 * Called by signal.get() when inside a tracking context.
 *
 * @param dep - The signal being accessed
 */
export function recordDep(dep: Dep): void {
  const context = getActiveContext();
  if (!context) {
    return;
  }

  if (context.source === dep) {
    throw new Error("Circular dependency detected: a signal cannot depend on itself");
  }

  context.deps.add(dep);
}

/**
 * Check if currently inside a tracking context.
 * Useful for conditional behavior in signal.get()
 */
export function isTracking(): boolean {
  return trackingStack.length > 0;
}

/**
 * Get current tracking depth (for debugging).
 */
export function getTrackingDepth(): number {
  return trackingStack.length;
}
