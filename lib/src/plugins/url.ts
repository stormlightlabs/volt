/**
 * URL plugin for synchronizing signals with URL parameters and hash routing
 * Supports one-way read, bidirectional sync, and hash-based routing
 */

import type { Optional } from "$types/helpers";
import type { PluginContext, Signal } from "$types/volt";

/**
 * URL plugin handler.
 * Synchronizes signal values with URL parameters and hash.
 *
 * Syntax: data-volt-url="mode:signalPath"
 * Modes:
 *   - read:signalPath - Read URL param into signal on mount (one-way)
 *   - sync:signalPath - Bidirectional sync between signal and URL param
 *   - hash:signalPath - Sync with hash portion for routing
 */
export function urlPlugin(context: PluginContext, value: string): void {
  const parts = value.split(":");
  if (parts.length !== 2) {
    console.error(`Invalid url binding: "${value}". Expected format: "mode:signalPath"`);
    return;
  }

  const [mode, signalPath] = parts.map((p) => p.trim());

  switch (mode) {
    case "read": {
      handleUrlRead(context, signalPath);
      break;
    }
    case "sync": {
      handleUrlSync(context, signalPath);
      break;
    }
    case "hash": {
      handleHashRouting(context, signalPath);
      break;
    }
    default: {
      console.error(`Unknown url mode: "${mode}"`);
    }
  }
}

/**
 * Read URL parameter into signal on mount (one-way).
 * Signal changes do not update URL.
 */
function handleUrlRead(context: PluginContext, signalPath: string): void {
  const signal = context.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for url read`);
    return;
  }

  const params = new URLSearchParams(globalThis.location.search);
  const paramValue = params.get(signalPath);

  if (paramValue !== null) {
    (signal as Signal<unknown>).set(deserializeValue(paramValue));
  }
}

/**
 * Bidirectional sync between signal and URL parameter.
 * Changes to either the signal or URL update the other.
 */
function handleUrlSync(context: PluginContext, signalPath: string): void {
  const signal = context.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for url sync`);
    return;
  }

  const params = new URLSearchParams(globalThis.location.search);
  const paramValue = params.get(signalPath);
  if (paramValue !== null) {
    (signal as Signal<unknown>).set(deserializeValue(paramValue));
  }

  let isUpdatingFromUrl = false;
  let updateTimeout: Optional<number>;

  const updateUrl = (value: unknown) => {
    if (isUpdatingFromUrl) return;

    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => {
      const params = new URLSearchParams(globalThis.location.search);
      const serialized = serializeValue(value);

      if (serialized === null || serialized === "") {
        params.delete(signalPath);
      } else {
        params.set(signalPath, serialized);
      }

      const newSearch = params.toString();
      const newUrl = newSearch ? `?${newSearch}` : globalThis.location.pathname;

      globalThis.history.pushState({}, "", newUrl);
    }, 100) as unknown as number;
  };

  const handlePopState = () => {
    isUpdatingFromUrl = true;
    const params = new URLSearchParams(globalThis.location.search);
    const paramValue = params.get(signalPath);

    if (paramValue === null) {
      (signal as Signal<unknown>).set("");
    } else {
      (signal as Signal<unknown>).set(deserializeValue(paramValue));
    }
    isUpdatingFromUrl = false;
  };

  const unsubscribe = signal.subscribe(updateUrl);
  globalThis.addEventListener("popstate", handlePopState);

  context.addCleanup(() => {
    unsubscribe();
    globalThis.removeEventListener("popstate", handlePopState);
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
  });
}

/**
 * Sync signal with hash portion of URL for client-side routing.
 * Bidirectional sync between signal and window.location.hash.
 */
function handleHashRouting(context: PluginContext, signalPath: string): void {
  const signal = context.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for hash routing`);
    return;
  }

  const currentHash = globalThis.location.hash.slice(1);
  if (currentHash) {
    (signal as Signal<string>).set(currentHash);
  }

  let isUpdatingFromHash = false;

  const updateHash = (value: unknown) => {
    if (isUpdatingFromHash) return;

    const hashValue = String(value ?? "");
    const newHash = hashValue ? `#${hashValue}` : "";

    if (globalThis.location.hash !== newHash) {
      globalThis.history.pushState({}, "", newHash || globalThis.location.pathname);
    }
  };

  const handleHashChange = () => {
    isUpdatingFromHash = true;
    const currentHash = globalThis.location.hash.slice(1);
    (signal as Signal<string>).set(currentHash);
    isUpdatingFromHash = false;
  };

  const unsubscribe = signal.subscribe(updateHash);
  globalThis.addEventListener("hashchange", handleHashChange);

  context.addCleanup(() => {
    unsubscribe();
    globalThis.removeEventListener("hashchange", handleHashChange);
  });
}

/**
 * Serialize a value for URL parameter storage.
 *
 * Handles strings, numbers, booleans, and No Value (null/undefined).
 */
function serializeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

/**
 * Deserialize a URL parameter value by attempting to parse as JSON, falls back to string.
 */
function deserializeValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (value === "undefined") return undefined;

  const numberValue = Number(value);
  if (!Number.isNaN(numberValue) && value !== "") {
    return numberValue;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
