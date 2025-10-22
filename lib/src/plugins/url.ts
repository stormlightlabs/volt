/**
 * URL plugin for synchronizing signals with URL parameters and hash routing
 * Supports one-way read, bidirectional sync, and hash-based routing
 */

import { isNil, kebabToCamel } from "$core/shared";
import type { Optional } from "$types/helpers";
import type { PluginContext, Scope, Signal } from "$types/volt";

type UrlMode = "read" | "sync" | "hash" | "history";

interface ResolvedSignal<T = unknown> {
  path: string;
  signal: Signal<T>;
}

function normalizeMode(mode: string): Optional<UrlMode> {
  const normalized = mode.trim().toLowerCase().replaceAll(/[\s_-]/g, "");

  switch (normalized) {
    case "read": {
      return "read";
    }
    case "sync":
    case "bidirectional": {
      return "sync";
    }
    case "query":
    case "search": {
      return "sync";
    }
    case "hash": {
      return "hash";
    }
    case "history":
    case "route": {
      return "history";
    }
    default: {
      return undefined;
    }
  }
}

function resolveCanonicalPath(scope: Scope, rawPath: string): string {
  const trimmed = rawPath.trim();
  if (!trimmed) {
    return trimmed;
  }

  const parts = trimmed.split(".");
  const resolved: string[] = [];
  let current: unknown = scope;

  for (const part of parts) {
    if (isNil(current) || typeof current !== "object") {
      resolved.push(part);
      current = undefined;
      continue;
    }

    const record = current as Record<string, unknown>;

    if (Object.hasOwn(record, part)) {
      resolved.push(part);
      current = record[part];
      continue;
    }

    const camelCandidate = kebabToCamel(part);
    if (Object.hasOwn(record, camelCandidate)) {
      resolved.push(camelCandidate);
      current = record[camelCandidate];
      continue;
    }

    const lower = part.toLowerCase();
    const matchedKey = Object.keys(record).find((key) => key.toLowerCase() === lower);

    if (matchedKey) {
      resolved.push(matchedKey);
      current = record[matchedKey];
      continue;
    }

    resolved.push(part);
    current = undefined;
  }

  return resolved.join(".");
}

function resolveSignal(ctx: PluginContext, rawPath: string): Optional<ResolvedSignal> {
  const trimmed = rawPath.trim();
  if (!trimmed) {
    return undefined;
  }

  const canonicalPath = resolveCanonicalPath(ctx.scope, trimmed);
  const candidatePaths = new Set([canonicalPath, trimmed]);

  for (const candidate of candidatePaths) {
    const found = ctx.findSignal(candidate);
    if (found) {
      return { path: candidate, signal: found as Signal<unknown> };
    }
  }

  return undefined;
}

/**
 * URL plugin handler.
 * Synchronizes signal values with URL parameters, hash, and full history state.
 *
 * Syntax: data-volt-url="mode:signalPath" or data-volt-url="mode:signalPath:basePath"
 * Alternate syntax: data-volt-url:signalPath="mode" (e.g., data-volt-url:search="query")
 * Modes:
 *   - read:signalPath - Read URL param into signal on mount (one-way)
 *   - sync:signalPath - Bidirectional sync between signal and URL param
 *   - hash:signalPath - Sync with hash portion for routing
 *   - history:signalPath[:basePath] - Sync with full path + search (History API routing)
 */
export function urlPlugin(ctx: PluginContext, value: string): void {
  const parts = value.split(":").map((part) => part.trim()).filter((part) => part.length > 0);
  if (parts.length < 2) {
    console.error(
      `Invalid url binding: "${value}". Expected format: "mode:signalPath[:basePath]" or "signalPath:mode[:basePath]"`,
    );
    return;
  }

  const firstMode = normalizeMode(parts[0]);
  const secondMode = normalizeMode(parts[1] ?? "");

  let mode: Optional<UrlMode>;
  let signalPath: string;
  let basePath: Optional<string>;

  if (firstMode) {
    mode = firstMode;
    signalPath = parts[1] ?? "";
    basePath = parts.slice(2).join(":") || undefined;
  } else if (secondMode) {
    mode = secondMode;
    signalPath = parts[0];
    basePath = parts.slice(2).join(":") || undefined;
  } else {
    console.error(`Unknown url mode in binding "${value}"`);
    return;
  }

  if (!signalPath) {
    console.error(`Signal path missing for url binding "${value}"`);
    return;
  }

  const resolvedSignal = resolveSignal(ctx, signalPath);
  if (!resolvedSignal) {
    console.error(`Signal "${signalPath}" not found for url binding`);
    return;
  }

  switch (mode) {
    case "read": {
      handleReadURL(resolvedSignal);
      break;
    }
    case "sync": {
      handleSyncURL(ctx, resolvedSignal);
      break;
    }
    case "hash": {
      handleHashRouting(ctx, resolvedSignal as ResolvedSignal<string>);
      break;
    }
    case "history": {
      handleHistoryRouting(ctx, resolvedSignal as ResolvedSignal<string>, basePath);
      break;
    }
  }
}

/**
 * Read URL parameter into signal on mount (one-way).
 * Signal changes do not update URL.
 */
function handleReadURL(resolved: ResolvedSignal): void {
  const params = new URLSearchParams(globalThis.location.search);
  const paramValue = params.get(resolved.path);

  if (paramValue !== null) {
    resolved.signal.set(deserializeValue(paramValue));
  }
}

/**
 * Bidirectional sync between signal and URL parameter.
 * Changes to either the signal or URL update the other.
 */
function handleSyncURL(ctx: PluginContext, resolved: ResolvedSignal): void {
  const params = new URLSearchParams(globalThis.location.search);
  const paramValue = params.get(resolved.path);
  if (paramValue !== null) {
    resolved.signal.set(deserializeValue(paramValue));
  }

  let isUpdatingFromUrl = false;
  let updateTimeout: Optional<number>;

  const updateUrl = (value: unknown) => {
    if (isUpdatingFromUrl) {
      return;
    }

    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => {
      const params = new URLSearchParams(globalThis.location.search);
      const serialized = serializeValue(value);

      if (isNil(serialized) || serialized === "") {
        params.delete(resolved.path);
      } else {
        params.set(resolved.path, serialized);
      }

      const newSearch = params.toString();
      const newUrl = newSearch ? `?${newSearch}` : globalThis.location.pathname;

      globalThis.history.pushState({}, "", newUrl);
    }, 100) as unknown as number;
  };

  const handlePopState = () => {
    isUpdatingFromUrl = true;
    const params = new URLSearchParams(globalThis.location.search);
    const paramValue = params.get(resolved.path);

    if (isNil(paramValue)) {
      resolved.signal.set("");
    } else {
      resolved.signal.set(deserializeValue(paramValue));
    }
    isUpdatingFromUrl = false;
  };

  const unsubscribe = resolved.signal.subscribe(updateUrl);
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
function handleHashRouting(ctx: PluginContext, resolved: ResolvedSignal<string>): void {
  const currentHash = globalThis.location.hash.slice(1);
  if (currentHash) {
    resolved.signal.set(currentHash);
  }

  let isUpdatingFromHash = false;

  const updateHash = (value: unknown) => {
    if (isUpdatingFromHash) {
      return;
    }

    const hashValue = String(value ?? "");
    const newHash = hashValue ? `#${hashValue}` : "";

    if (globalThis.location.hash !== newHash) {
      globalThis.history.pushState({}, "", newHash || globalThis.location.pathname);
    }
  };

  const handleHashChange = () => {
    isUpdatingFromHash = true;
    const currentHash = globalThis.location.hash.slice(1);
    resolved.signal.set(currentHash);
    isUpdatingFromHash = false;
  };

  const unsubscribe = resolved.signal.subscribe(updateHash);
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

function normalizeRoute(path: string) {
  if (!path) {
    return "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Sync signal with full path + search params for History API routing.
 * Bidirectional sync between signal and window.location.pathname + search.
 */
function handleHistoryRouting(ctx: PluginContext, resolved: ResolvedSignal<string>, basePath?: string): void {
  const base = basePath?.trim() ?? "";

  const extractRoute = () => {
    const fullPath = globalThis.location.pathname + globalThis.location.search;
    if (base && fullPath.startsWith(base)) {
      const stripped = fullPath.slice(base.length) || "/";
      return normalizeRoute(stripped);
    }
    return normalizeRoute(fullPath);
  };

  const currentRoute = extractRoute();
  resolved.signal.set(currentRoute);

  let isUpdatingFromHistory = false;

  const updateUrl = (value: unknown) => {
    if (isUpdatingFromHistory) {
      return;
    }

    const route = normalizeRoute(String(value ?? "/"));
    const fullPath = base ? `${base}${route}` : route;
    const currentFull = globalThis.location.pathname + globalThis.location.search;

    if (currentFull !== fullPath) {
      globalThis.history.pushState({}, "", fullPath);
      globalThis.dispatchEvent(
        new CustomEvent("volt:navigate", { detail: { url: fullPath, route }, bubbles: true, cancelable: false }),
      );
    }
  };

  const handlePopState = () => {
    isUpdatingFromHistory = true;
    const route = extractRoute();
    resolved.signal.set(route);
    globalThis.dispatchEvent(new CustomEvent("volt:popstate", { detail: { route }, bubbles: true, cancelable: false }));
    isUpdatingFromHistory = false;
  };

  const handleNavigate = () => {
    isUpdatingFromHistory = true;
    resolved.signal.set(extractRoute());
    isUpdatingFromHistory = false;
  };

  const unsubscribe = resolved.signal.subscribe(updateUrl);
  globalThis.addEventListener("popstate", handlePopState);
  globalThis.addEventListener("volt:navigate", handleNavigate);

  ctx.addCleanup(() => {
    unsubscribe();
    globalThis.removeEventListener("popstate", handlePopState);
    globalThis.removeEventListener("volt:navigate", handleNavigate);
  });
}
