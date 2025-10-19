# Debugging

The Volt.js debugging system provides introspection and visualization tools for reactive primitives.
It's a lazy-loadable module (`volt/debug`) that doesn't affect production bundle size.

## Architecture

The debugging system consists of three interconnected modules:

1. **Registry** tracks all signals and reactive objects with metadata (ID, type, name, creation timestamp).
    Uses WeakMaps and WeakRefs to avoid memory leaks because signals can be garbage collected normally.
    Auto-increments IDs like `signal-1`, `computed-2`, `reactive-3`.
2. **Graph** tracks dependency relationships between signals. Records which signals depend on others and enables cycle detection, depth calculation, and dependency visualization. Also uses WeakMaps to avoid memory pressure.
3. **Logger** provides console output utilities for inspecting signals, viewing dependency trees, watching value changes, and tracing updates with stack traces.

## Debug API

The module exports wrapped versions of core primitives that automatically register with the debug system:

- `debugSignal()` creates a signal and registers it with optional name. Returns standard Signal interface.
- `debugComputed()` creates a computed signal and registers it. Attempts to record dependency relationships (though this is currently limited by internal tracking visibility).
- `debugReactive()` creates a reactive proxy and registers it for introspection.

These wrappers are drop-in replacements for the core APIs. For existing code, use `attachDebugger()` to register signals post-creation.

## The vdebugger Object

All debugging utilities are also exported as methods on a single `vdebugger` namespace object:

```ts
vdebugger.signal(0, 'count')          // Create debug signal
vdebugger.getAllSignals()             // Get all tracked signals
vdebugger.log(mySignal)               // Pretty-print signal info
vdebugger.trace(mySignal)             // Trace all updates
vdebugger.watch(mySignal)             // Watch with full dependency tree
vdebugger.buildGraph(signals)         // Build dependency graph
vdebugger.detectCycles(mySignal)      // Find circular dependencies
```

This namespace provides a convenient entry point for debugging in the browser console.

## Registry System

The registry maintains two separate tracking systems:

1. **Signal Registry** uses a WeakMap to store metadata and a Set of WeakRefs to track all signals.
    When `getAllSignals()` is called, it automatically cleans up garbage-collected signals by checking `WeakRef.deref()`.
2. **Reactive Registry** mirrors this pattern for reactive objects, storing metadata and WeakRefs separately.

Metadata includes:

- `id`: Unique identifier with type prefix
- `type`: One of "signal", "computed", "reactive"
- `name`: Optional developer-provided name
- `createdAt`: Timestamp for age calculations

The registry exposes `getSignalInfo()` and `getReactiveInfo()` which combine metadata with current value and calculated age.
The `nameSignal()` and `nameReactive()` functions allow naming signals after creation.

Registry stats can be retrieved via `getRegistryStats()` which counts regular signals, computed signals, and reactive objects.

## Dependency Graph

The graph module tracks relationships using two WeakMaps:

1. `dependencies` maps from signal to Set of signals it depends on.
2. `dependents` maps from signal to Set of signals that depend on it.

When `recordDependencies()` is called, it updates both maps bidirectionally. This enables efficient queries in both directions.
It allows you to answer, "what does this signal depend on?" and "what depends on this signal?"

### Graph Operations

- `buildDependencyGraph()` constructs a full graph representation with nodes and edges, suitable for visualization tools. Each node includes signal metadata, current value, and lists of dependency/dependent IDs.
- `detectCircularDependencies()` uses depth-first search with path tracking. Returns array of signals forming the cycle, or null if no cycle exists. This helps catch bugs where signals accidentally reference themselves through intermediaries.
- `getSignalDepth()` calculates how deep a signal is in the dependency tree. Signals with no dependencies have depth 0. Computed signals that depend on base signals have depth 1, computeds depending on other computeds have higher depths. Uses visited set to handle shared dependencies correctly.
- `hasDependency()` checks for direct dependency relationship between two signals.

The graph tracking is currently limited because dependency recording happens manually during debug signal creation. The core computed/effect tracking is internal to those primitives and not exposed to the debug system.

## Logging Utilities

The logger provides multiple output formats:

`logSignal()` pretty-prints a signal with grouped console output showing type, current value, age in seconds, dependency count, and dependent count. If dependencies or dependents exist, it expands groups showing each one with its name and current value.

`logAllSignals()` lists all tracked signals in a compact format with ID, name, and value.

`logSignalTable()` outputs signals as a formatted console table with columns for ID, name, type, value (truncated), age, dependency count, and dependent count.

`logReactive()` and `logAllReactives()` provide similar output for reactive objects, though reactive objects don't have dependency tracking (dependencies are on the internal signals created by the proxy).

`trace()` enables update tracing for a signal. Subscribes to changes and logs each update with the new value and a stack trace showing where the update originated. Uses `Error().stack` to capture the call stack. Tracked signals are stored in a WeakSet to avoid duplicate tracing. Currently, unsubscribing is incomplete due to not storing unsubscribe functions.

`watch()` subscribes to a signal and logs full information on every update, including timestamp and complete dependency tree. Returns unsubscribe function for cleanup.

`enableGlobalTracing()` and `disableGlobalTracing()` enable or disable tracing for all registered signals. Useful for debugging complex reactive flows.

## Usage Patterns

For development, import debug utilities directly:

```ts
import { debugSignal, debugComputed, logAllSignals, buildDependencyGraph } from 'volt/debug';
```

For debugging existing code, attach debugger to existing signals:

```ts
import { signal } from 'volt';
import { attachDebugger, vdebugger } from 'volt/debug';

const count = signal(0);
attachDebugger(count, 'signal', 'count');
vdebugger.log(count);
```

For browser console debugging, expose vdebugger globally:

```ts
import { vdebugger } from 'volt/debug';
window.vdebugger = vdebugger;
```

Then in console:

```js
vdebugger.logAll()
vdebugger.trace(someSignal)
vdebugger.buildGraph(vdebugger.getAllSignals())
```

## Memory Considerations

All tracking uses WeakMaps and WeakRefs to prevent memory leaks. Signals and reactive objects can be garbage collected normally. The registry automatically cleans up dead WeakRefs when queried.

The dependency graph also uses WeakMaps, so edges are cleaned up when signals are collected.

However, tracing and watching create subscriptions which hold references to signals. Always call the returned unsubscribe function when done watching to allow cleanup.

## Limitations

1. Dependency recording for computed signals is incomplete. The `extractComputedDeps()` helper can't access internal dependency tracking, so dependency graph may be incomplete for debug computeds.
2. Trace unsubscription doesn't work properly because unsubscribe functions aren't stored in the traceListeners WeakMap.
3. Graph tracking only works for signals created via debug APIs or manually attached. Regular signals created with core APIs aren't tracked unless explicitly registered.
4. Reactive objects are tracked as single units, but the internal per-property signals created by the proxy aren't exposed to the debug system.

These limitations don't affect the core reactive system, they only reduce the visibility of the debug tools.
