/**
 * Console logging utilities for debugging signals.
 *
 * Provides pretty-printed output and update tracing.
 */

import type { AnySignal } from "$types/volt";
import { getDependencies, getDependents } from "./graph";
import { getAllReactives, getAllSignals, getReactiveInfo, getSignalInfo } from "./registry";

const trackedSignals = new WeakSet<AnySignal>();
const traceListeners = new WeakMap<AnySignal, (value: unknown) => void>();

/**
 * Pretty-print a signal's information to the console.
 */
export function logSignal(signal: AnySignal): void {
  const info = getSignalInfo(signal);
  if (!info) {
    console.log("[Volt Debug] Unregistered signal");
    return;
  }

  const deps = getDependencies(signal);
  const depnts = getDependents(signal);

  console.group(`[Volt Signal] ${info.name || info.id}`);
  console.log("Type:", info.type);
  console.log("Value:", info.value);
  console.log("Age:", `${(info.age / 1000).toFixed(2)}s`);
  console.log("Dependencies:", deps.length);
  console.log("Dependents:", depnts.length);

  if (deps.length > 0) {
    console.group("Depends on:");
    for (const dep of deps) {
      const depInfo = getSignalInfo(dep as AnySignal);
      if (depInfo) {
        console.log(`  - ${depInfo.name || depInfo.id} = ${depInfo.value}`);
      }
    }
    console.groupEnd();
  }

  if (depnts.length > 0) {
    console.group("Dependents:");
    for (const depnt of depnts) {
      const depntInfo = getSignalInfo(depnt);
      if (depntInfo) {
        console.log(`  - ${depntInfo.name || depntInfo.id}`);
      }
    }
    console.groupEnd();
  }

  console.groupEnd();
}

export function logAllSignals(): void {
  const signals = getAllSignals();
  console.group(`[Volt Debug] All Signals (${signals.length})`);

  for (const signal of signals) {
    const info = getSignalInfo(signal);
    if (info) {
      console.log(`${info.id.padEnd(15)} ${(info.name || "unnamed").padEnd(20)} ${String(info.value)}`);
    }
  }

  console.groupEnd();
}

/**
 * Pretty-print a reactive object's information to the console.
 */
export function logReactive(obj: object): void {
  const info = getReactiveInfo(obj);
  if (!info) {
    console.log("[Volt Debug] Unregistered reactive object");
    return;
  }

  console.group(`[Volt Reactive] ${info.name || info.id}`);
  console.log("Type:", info.type);
  console.log("Value:", info.value);
  console.log("Age:", `${(info.age / 1000).toFixed(2)}s`);
  console.groupEnd();
}

export function logAllReactives(): void {
  const reactives = getAllReactives();
  console.group(`[Volt Debug] All Reactive Objects (${reactives.length})`);

  for (const obj of reactives) {
    const info = getReactiveInfo(obj);
    if (info) {
      console.log(`${info.id.padEnd(15)} ${(info.name || "unnamed").padEnd(20)} ${JSON.stringify(info.value)}`);
    }
  }

  console.groupEnd();
}

export function trace(signal: AnySignal, enabled = true): void {
  if (!enabled) {
    const listener = traceListeners.get(signal);
    if (listener) {
      // Can't unsubscribe without keeping the unsubscribe function
      // TODO: we need to store unsubscribe functions
      trackedSignals.delete(signal);
      traceListeners.delete(signal);
    }
    return;
  }

  if (trackedSignals.has(signal)) {
    return;
  }

  const info = getSignalInfo(signal);
  const name = info?.name || info?.id || "unknown";

  const listener = (value: unknown) => {
    const stack = new Error("Listener").stack;
    const caller = stack?.split("\n")[3]?.trim();

    console.log(`[Volt Trace] ${name} changed:`, value, caller ? `(from ${caller})` : "");
  };

  signal.subscribe(listener);
  traceListeners.set(signal, listener);
  trackedSignals.add(signal);

  console.log(`[Volt Debug] Tracing enabled for ${name}`);
}

export function enableGlobalTracing(): void {
  const signals = getAllSignals();
  console.log(`[Volt Debug] Enabling global tracing for ${signals.length} signals`);

  for (const signal of signals) {
    trace(signal, true);
  }
}

export function disableGlobalTracing(): void {
  const signals = getAllSignals();
  for (const signal of signals) {
    trace(signal, false);
  }

  console.log("[Volt Debug] Global tracing disabled");
}

export function logSignalTable(): void {
  const signals = getAllSignals();
  const data = signals.map((signal) => {
    const info = getSignalInfo(signal);
    if (!info) return null;

    return {
      ID: info.id,
      Name: info.name || "(unnamed)",
      Type: info.type,
      Value: String(info.value).slice(0, 50),
      "Age (s)": (info.age / 1000).toFixed(2),
      Dependencies: getDependencies(signal).length,
      Dependents: getDependents(signal).length,
    };
  }).filter((row): row is NonNullable<typeof row> => row !== null);

  console.table(data);
}

export function watch(signal: AnySignal): () => void {
  const info = getSignalInfo(signal);
  const name = info?.name || info?.id || "unknown";

  console.log(`[Volt Debug] Watching ${name}`);

  const unsubscribe = signal.subscribe((value) => {
    const timestamp = new Date().toISOString();
    console.group(`[Volt Watch] ${name} updated at ${timestamp}`);
    console.log("New value:", value);
    logSignal(signal);
    console.groupEnd();
  });

  return () => {
    console.log(`[Volt Debug] Stopped watching ${name}`);
    unsubscribe();
  };
}
