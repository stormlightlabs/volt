import type { Optional } from "$types/helpers";
import type { Dep, Scope, Signal } from "$types/volt";

export function kebabToCamel(str: string): string {
  return str.replaceAll(/-([a-z])/g, (_, letter) => letter.toUpperCase());
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
  const parts = trimmed.split(".");
  let current: unknown = scope;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
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
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
