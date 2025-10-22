/**
 * @packageDocumentation Shared module
 *
 * functions exported from this module should only depend on types and other helpers
 */
import type { None, Optional } from "$types/helpers";
import type { BindingContext, Dep, Scope, Signal } from "$types/volt";

export function kebabToCamel(str: string): string {
  return str.replaceAll(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Check if a value is null or undefined ({@link None}).
 */
export function isNil(value: unknown): value is None {
  return value === null || value === undefined;
}

export function isSignal(value: unknown): value is Dep {
  return (typeof value === "object"
    && value !== null
    && "get" in value
    && "subscribe" in value
    && typeof value.get === "function"
    && typeof (value as { subscribe: unknown }).subscribe === "function");
}

export function findScopedSignal(scope: Scope, path: string): Optional<Signal<unknown>> {
  const trimmed = path.trim();
  if (!trimmed) {
    return undefined;
  }

  const parts = trimmed.split(".");
  let current: unknown = scope;

  for (const part of parts) {
    if (isNil(current) || typeof current !== "object") {
      return undefined;
    }

    const record = current as Record<string, unknown>;

    if (Object.hasOwn(record, part)) {
      current = record[part];
      continue;
    }

    const camelCandidate = kebabToCamel(part);
    if (Object.hasOwn(record, camelCandidate)) {
      current = record[camelCandidate];
      continue;
    }

    const lowerPart = part.toLowerCase();
    const matchedKey = Object.keys(record).find((key) => key.toLowerCase() === lowerPart);
    if (!matchedKey) {
      return undefined;
    }

    current = record[matchedKey];
  }

  if (isSignal(current)) {
    return current as Signal<unknown>;
  }

  return undefined;
}

/**
 * Get all data-volt-computed:name attributes from an element.
 * Converts kebab-case names to camelCase to match JS conventions.
 */
export function getComputedAttributes(el: Element): Map<string, string> {
  const computed = new Map<string, string>();

  for (const attr of el.attributes) {
    if (attr.name.startsWith("data-volt-computed:")) {
      const name = attr.name.slice("data-volt-computed:".length);
      const camelName = kebabToCamel(name);
      computed.set(camelName, attr.value);
    }
  }

  return computed;
}

/**
 * Sleep for a specified duration in ms
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract all signal dependencies from an expression by finding identifiers that correspond to signals in the scope.
 *
 * This function handles both simple property paths (e.g., "todo.title") and complex expressions (e.g., "email.length > 0 && emailValid").
 * It also handles special $store.get() and $store.set() calls by extracting the key and finding the underlying signal.
 *
 * @param expr - The expression to analyze
 * @param scope - The scope containing potential signal dependencies
 * @returns Array of signals found in the expression
 */
export function extractDeps(expr: string, scope: Scope): Array<Dep> {
  const deps: Array<Dep> = [];
  const seen = new Set<string>();
  const storeCalls = expr.matchAll(/\$store\.(get|set|has)\s*\(\s*['"]([^'"]+)['"]\s*(?:,|\))/g);

  for (const match of storeCalls) {
    const key = match[2];
    const storeKey = `$store.${key}`;

    if (seen.has(storeKey)) {
      continue;
    }

    seen.add(storeKey);

    const store = scope.$store;
    if (store && typeof store === "object" && "_signals" in store) {
      const storeSignals = store._signals as Map<string, Signal<unknown>>;
      const signal = storeSignals.get(key);
      if (signal && !deps.includes(signal)) {
        deps.push(signal);
      }
    }
  }

  const matches = expr.matchAll(/\b([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\b/g);

  for (const match of matches) {
    const path = match[1];

    if (["true", "false", "null", "undefined"].includes(path)) {
      continue;
    }

    if (seen.has(path)) {
      continue;
    }

    seen.add(path);

    const signal = findScopedSignal(scope, path);
    if (signal) {
      deps.push(signal);
      continue;
    }

    const parts = path.split(".");
    const topLevel = parts[0];
    const value = scope[topLevel];
    if (isSignal(value) && !deps.includes(value)) {
      deps.push(value);
    }
  }

  return deps;
}

/**
 * Helper function to execute an update function and subscribe to all signal dependencies.
 * Used by bindings that need reactive updates (class, show, style, for, if) to register cleanup functions.
 */
export function updateAndRegister(ctx: BindingContext, update: () => void, expr: string) {
  update();
  const deps = extractDeps(expr, ctx.scope);
  for (const dep of deps) {
    const unsubscribe = dep.subscribe(update);
    ctx.cleanups.push(unsubscribe);
  }
}
