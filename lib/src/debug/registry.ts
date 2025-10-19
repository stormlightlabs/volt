/**
 * Signal registry for debugging and introspection.
 *
 * Tracks all signals with metadata for development tooling.
 * Uses WeakMap to avoid memory leaks - signals can be garbage collected.
 */

import type { Optional } from "$types/helpers";
import type { ComputedSignal, Signal, SignalMetadata, SignalType } from "$types/volt";

type SignalInfo = { id: string; type: SignalType; name?: string; value: unknown; createdAt: number; age: number };

type ReactiveInfo = { id: string; type: SignalType; name?: string; value: unknown; createdAt: number; age: number };

type RegistryStats = { totalSignals: number; regularSignals: number; computedSignals: number; reactiveObjects: number };

let nextId = 1;
const signalMetadata = new WeakMap<Signal<unknown> | ComputedSignal<unknown>, SignalMetadata>();
const allSignals = new Set<WeakRef<Signal<unknown> | ComputedSignal<unknown>>>();
const reactiveMetadata = new WeakMap<object, SignalMetadata>();
const allReactives = new Set<WeakRef<object>>();

/**
 * Register a signal in the debug registry. Should be called when a signal or computed is created.
 */
export function registerSignal(sig: Signal<unknown> | ComputedSignal<unknown>, type: SignalType, name?: string): void {
  if (signalMetadata.has(sig)) {
    return;
  }

  const metadata: SignalMetadata = { id: `${type}-${nextId++}`, type, name, createdAt: Date.now() };

  signalMetadata.set(sig, metadata);
  allSignals.add(new WeakRef(sig));
}

export function getSignalMetadata(sig: Signal<unknown> | ComputedSignal<unknown>): SignalMetadata | undefined {
  return signalMetadata.get(sig);
}

/**
 * Get all currently tracked signals.
 * Automatically cleans up garbage-collected signals.
 */
export function getAllSignals(): Array<Signal<unknown> | ComputedSignal<unknown>> {
  const active: Array<Signal<unknown> | ComputedSignal<unknown>> = [];
  const toDelete: Array<WeakRef<Signal<unknown> | ComputedSignal<unknown>>> = [];

  for (const ref of allSignals) {
    const sig = ref.deref();
    if (sig) {
      active.push(sig);
    } else {
      toDelete.push(ref);
    }
  }

  for (const ref of toDelete) {
    allSignals.delete(ref);
  }

  return active;
}

export function getSignalInfo(sig: Signal<unknown> | ComputedSignal<unknown>): Optional<SignalInfo> {
  const metadata = signalMetadata.get(sig);
  if (!metadata) {
    return undefined;
  }

  return {
    id: metadata.id,
    type: metadata.type,
    name: metadata.name,
    value: sig.get(),
    createdAt: metadata.createdAt,
    age: Date.now() - metadata.createdAt,
  };
}

export function nameSignal(sig: Signal<unknown> | ComputedSignal<unknown>, name: string): void {
  const metadata = signalMetadata.get(sig);
  if (metadata) {
    metadata.name = name;
  }
}

export function clearRegistry(): void {
  allSignals.clear();
  allReactives.clear();
  nextId = 1;
}

export function getRegistryStats(): RegistryStats {
  const signals = getAllSignals();
  let regularSignals = 0;
  let computedSignals = 0;

  for (const sig of signals) {
    const metadata = signalMetadata.get(sig);
    if (metadata) {
      if (metadata.type === "signal") {
        regularSignals++;
      } else {
        computedSignals++;
      }
    }
  }

  const reactives = getAllReactives();

  return { totalSignals: signals.length, regularSignals, computedSignals, reactiveObjects: reactives.length };
}

export function registerReactive(obj: object, name?: string): void {
  if (reactiveMetadata.has(obj)) {
    return;
  }

  const metadata: SignalMetadata = { id: `reactive-${nextId++}`, type: "reactive", name, createdAt: Date.now() };

  reactiveMetadata.set(obj, metadata);
  allReactives.add(new WeakRef(obj));
}

export function getReactiveMetadata(obj: object): SignalMetadata | undefined {
  return reactiveMetadata.get(obj);
}

/**
 * Get all currently tracked reactive objects.
 * Automatically cleans up garbage-collected objects.
 */
export function getAllReactives(): object[] {
  const active: object[] = [];
  const toDelete: Array<WeakRef<object>> = [];

  for (const ref of allReactives) {
    const obj = ref.deref();
    if (obj) {
      active.push(obj);
    } else {
      toDelete.push(ref);
    }
  }

  for (const ref of toDelete) {
    allReactives.delete(ref);
  }

  return active;
}

export function getReactiveInfo(obj: object): Optional<ReactiveInfo> {
  const metadata = reactiveMetadata.get(obj);
  if (!metadata) {
    return undefined;
  }

  return {
    id: metadata.id,
    type: metadata.type,
    name: metadata.name,
    value: obj,
    createdAt: metadata.createdAt,
    age: Date.now() - metadata.createdAt,
  };
}

export function nameReactive(obj: object, name: string): void {
  const metadata = reactiveMetadata.get(obj);
  if (metadata) {
    metadata.name = name;
  }
}
