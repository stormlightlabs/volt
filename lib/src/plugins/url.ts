/**
 * URL plugin for synchronizing signals with URL parameters and hash routing
 * Supports one-way read, bidirectional sync, and hash-based routing
 */

import { isNil } from "$core/shared";
import type { Optional } from "$types/helpers";
import type { PluginContext, Signal } from "$types/volt";

/**
 * URL plugin handler.
 * Synchronizes signal values with URL parameters, hash, and full history state.
 *
 * Syntax: data-volt-url="mode:signalPath" or data-volt-url="mode:signalPath:basePath"
 * Modes:
 *   - read:signalPath - Read URL param into signal on mount (one-way)
 *   - sync:signalPath - Bidirectional sync between signal and URL param
 *   - hash:signalPath - Sync with hash portion for routing
 *   - history:signalPath[:basePath] - Sync with full path + search (History API routing)
 */
export function urlPlugin(ctx: PluginContext, value: string): void {
  const parts = value.split(":");
  if (parts.length < 2) {
    console.error(`Invalid url binding: "${value}". Expected format: "mode:signalPath[:basePath]"`);
    return;
  }

  const [mode, signalPath, basePath] = parts.map((p) => p.trim());

  switch (mode) {
    case "read": {
      handleReadURL(ctx, signalPath);
      break;
    }
    case "sync": {
      handleSyncURL(ctx, signalPath);
      break;
    }
    case "hash": {
      handleHashRouting(ctx, signalPath);
      break;
    }
    case "history": {
      handleHistoryRouting(ctx, signalPath, basePath);
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
function handleReadURL(ctx: PluginContext, signalPath: string): void {
  const signal = ctx.findSignal(signalPath);
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
function handleSyncURL(ctx: PluginContext, signalPath: string): void {
  const signal = ctx.findSignal(signalPath);
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

      if (isNil(serialized) || serialized === "") {
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

    if (isNil(paramValue)) {
      (signal as Signal<unknown>).set("");
    } else {
      (signal as Signal<unknown>).set(deserializeValue(paramValue));
    }
    isUpdatingFromUrl = false;
  };

  const unsubscribe = signal.subscribe(updateUrl);
  globalThis.addEventListener("popstate", handlePopState);

  ctx.addCleanup(() => {
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
function handleHashRouting(ctx: PluginContext, signalPath: string): void {
  const signal = ctx.findSignal(signalPath);
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

  ctx.addCleanup(() => {
    unsubscribe();
    globalThis.removeEventListener("hashchange", handleHashChange);
  });
}

/**
 * Serialize a value for URL parameter storage.
 * Handles strings, numbers, booleans, and No Value (null/undefined).
 */
function serializeValue(value: unknown): string {
  if (isNil(value)) {
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

/**
 * Sync signal with full path + search params for History API routing.
 * Bidirectional sync between signal and window.location.pathname + search.
 *
 * @param ctx - Plugin context
 * @param signalPath - Signal path to sync
 * @param basePath - Optional base path to strip from routes (e.g., "/app")
 */
function handleHistoryRouting(ctx: PluginContext, signalPath: string, basePath?: string): void {
  const signal = ctx.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for history routing`);
    return;
  }

  const base = basePath || "";
  const getCurrentRoute = (): string => {
    const fullPath = globalThis.location.pathname + globalThis.location.search;
    if (base && fullPath.startsWith(base)) {
      return fullPath.slice(base.length) || "/";
    }
    return fullPath;
  };

  const currentRoute = getCurrentRoute();
  if (currentRoute) {
    (signal as Signal<string>).set(currentRoute);
  }

  let isUpdatingFromHistory = false;

  const updateUrl = (value: unknown) => {
    if (isUpdatingFromHistory) return;

    const route = String(value ?? "/");
    const fullPath = base ? `${base}${route}` : route;

    if (globalThis.location.pathname + globalThis.location.search !== fullPath) {
      globalThis.history.pushState({}, "", fullPath);
      globalThis.dispatchEvent(
        new CustomEvent("volt:navigate", { detail: { url: fullPath, route }, bubbles: true, cancelable: false }),
      );
    }
  };

  const handlePopState = () => {
    isUpdatingFromHistory = true;
    const route = getCurrentRoute();
    (signal as Signal<string>).set(route);
    globalThis.dispatchEvent(new CustomEvent("volt:popstate", { detail: { route }, bubbles: true, cancelable: false }));
    isUpdatingFromHistory = false;
  };

  const handleNavigate = () => {
    isUpdatingFromHistory = true;
    const route = getCurrentRoute();
    (signal as Signal<string>).set(route);
    isUpdatingFromHistory = false;
  };

  const unsubscribe = signal.subscribe(updateUrl);
  globalThis.addEventListener("popstate", handlePopState);
  globalThis.addEventListener("volt:navigate", handleNavigate);

  ctx.addCleanup(() => {
    unsubscribe();
    globalThis.removeEventListener("popstate", handlePopState);
    globalThis.removeEventListener("volt:navigate", handleNavigate);
  });
}
