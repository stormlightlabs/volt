/**
 * Dependency graph tracking and querying for debugging.
 *
 * Tracks signal dependency relationships to enable visualization
 * and debugging of reactive data flow.
 */

import type { AnySignal, Dep, DepGraph, GraphNode } from "$types/volt";
import { getSignalMetadata } from "./registry";

const dependencies = new WeakMap<AnySignal, Set<Dep>>();
const dependents = new WeakMap<Dep, Set<AnySignal>>();

/**
 * Record that a signal/computed depends on certain dependencies.
 * Should be called after tracking is complete.
 */
export function recordDependencies(signal: AnySignal, deps: Dep[]): void {
  const existingDeps = dependencies.get(signal) || new Set();

  for (const dep of deps) {
    existingDeps.add(dep);

    const existingDependents = dependents.get(dep) || new Set();
    existingDependents.add(signal);
    dependents.set(dep, existingDependents);
  }

  dependencies.set(signal, existingDeps);
}

/**
 * Get all signals that this signal/computed depends on.
 */
export function getDependencies(signal: AnySignal): Dep[] {
  const deps = dependencies.get(signal);
  return deps ? [...deps] : [];
}

/**
 * Get all signals/computeds that depend on this signal.
 */
export function getDependents(signal: Dep): AnySignal[] {
  const deps = dependents.get(signal);
  return deps ? [...deps] : [];
}

/**
 * Check if there's a dependency relationship between two signals.
 */
export function hasDependency(dependent: AnySignal, dependency: Dep): boolean {
  const deps = dependencies.get(dependent);
  return deps ? deps.has(dependency) : false;
}

export function buildDependencyGraph(signals: AnySignal[]): DepGraph {
  const nodes: GraphNode[] = [];
  const edges: Array<{ from: string; to: string }> = [];
  const signalToId = new Map<AnySignal, string>();

  for (const signal of signals) {
    const metadata = getSignalMetadata(signal);
    if (!metadata) continue;

    signalToId.set(signal, metadata.id);

    const deps = getDependencies(signal);
    const depIds = deps.map((dep) => {
      const depMetadata = getSignalMetadata(dep as AnySignal);
      return depMetadata?.id;
    }).filter((id): id is string => id !== undefined);

    const depnts = getDependents(signal);
    const depntIds = depnts.map((depnt) => {
      const depntMetadata = getSignalMetadata(depnt);
      return depntMetadata?.id;
    }).filter((id): id is string => id !== undefined);

    nodes.push({
      signal,
      id: metadata.id,
      name: metadata.name,
      type: metadata.type,
      value: signal.get(),
      dependencies: depIds,
      dependents: depntIds,
    });
  }

  for (const node of nodes) {
    for (const depId of node.dependencies) {
      edges.push({ from: depId, to: node.id });
    }
  }

  return { nodes, edges };
}

export function detectCircularDependencies(signal: AnySignal): AnySignal[] | null {
  const visited = new Set<AnySignal>();
  const path = new Set<AnySignal>();

  function dfs(current: AnySignal): AnySignal[] | null {
    if (path.has(current)) {
      return [current];
    }

    if (visited.has(current)) {
      return null;
    }

    visited.add(current);
    path.add(current);

    const deps = getDependencies(current);
    for (const dep of deps) {
      const cycle = dfs(dep as AnySignal);
      if (cycle) {
        cycle.push(current);
        return cycle;
      }
    }

    path.delete(current);
    return null;
  }

  return dfs(signal);
}

/**
 * Get the depth of a signal in the dependency tree.
 * Signals with no dependencies have depth 0.
 */
export function getSignalDepth(signal: AnySignal): number {
  const visited = new Set<AnySignal>();

  function calculateDepth(current: AnySignal): number {
    if (visited.has(current)) {
      return 0;
    }

    visited.add(current);

    const deps = getDependencies(current);
    if (deps.length === 0) {
      return 0;
    }

    let maxDepth = 0;
    for (const dep of deps) {
      const depth = calculateDepth(dep as AnySignal);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth + 1;
  }

  return calculateDepth(signal);
}

export function clearDependencyGraph(): void {
  // WeakMaps don't have a clear method, but we can't do much here
  // The GC will clean up when signals are no longer referenced
}
