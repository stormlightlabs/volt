/**
 * Modifier utilities for event and input bindings
 *
 * Provides parsing and application of modifiers like .prevent, .stop, .debounce, etc.
 */

import type { Optional, Timer } from "$types/helpers";
import type { Modifier, ParsedAttribute, TimedFunction } from "$types/volt";

/**
 * Parse attribute name to extract base name and modifiers.
 *
 * Modifiers are separated by dashes only when the entire string uses dash-case (e.g., from dataset).
 * This allows attribute names to contain dashes (like aria-label) while still supporting modifiers.
 *
 * Examples:
 * - "click-prevent-stop" -> {baseName: "click", modifiers: [{name: "prevent"}, {name: "stop"}]}
 * - "aria-label" -> {baseName: "aria-label", modifiers: []} (no modifiers detected)
 * - "input-debounce500" -> {baseName: "input", modifiers: [{name: "debounce", value: 500}]}
 *
 * @param attrName - The attribute name with potential modifiers
 * @returns Parsed attribute with base name and modifiers array
 */
export function parseModifiers(attrName: string): ParsedAttribute {
  const parts = attrName.split("-");

  if (parts.length === 1) {
    return { baseName: attrName, modifiers: [] };
  }

  const baseName = parts[0];
  const modifiers: Modifier[] = [];
  const KNOWN_MODIFIERS = new Set([
    "prevent",
    "stop",
    "self",
    "window",
    "document",
    "once",
    "debounce",
    "throttle",
    "passive",
    "number",
    "trim",
    "lazy",
  ]);

  let i = 1;
  while (i < parts.length) {
    const part = parts[i];

    const numMatch = /^([a-zA-Z]+)(\d+)$/.exec(part);
    if (numMatch && KNOWN_MODIFIERS.has(numMatch[1])) {
      modifiers.push({ name: numMatch[1], value: Number(numMatch[2]) });
      i++;
    } else if (KNOWN_MODIFIERS.has(part)) {
      if (i + 1 < parts.length) {
        const numValue = Number(parts[i + 1]);
        if (!Number.isNaN(numValue)) {
          modifiers.push({ name: part, value: numValue });
          i += 2;
          continue;
        }
      }
      modifiers.push({ name: part });
      i++;
    } else {
      break;
    }
  }

  if (modifiers.length === 0) {
    return { baseName: attrName, modifiers: [] };
  }

  return { baseName, modifiers };
}

/**
 * Check if a modifier is present in the modifiers array
 */
export function hasModifier(modifiers: Modifier[], name: string): boolean {
  return modifiers.some((m) => m.name === name);
}

/**
 * Get a modifier's value or return a default
 */
export function getModifierValue(modifiers: Modifier[], name: string, defaultValue: number): number {
  const modifier = modifiers.find((m) => m.name === name);
  return modifier?.value ?? defaultValue;
}

/**
 * Create a debounced version of a function.
 * Delays execution until after the specified wait time has elapsed since the last call.
 *
 * @param fn - Function to debounce
 * @param wait - Milliseconds to wait before executing
 * @returns Debounced function with cleanup method
 */
export function debounce<T extends unknown[], R>(fn: (...args: T) => R, wait: number): TimedFunction<T> {
  let timeoutId: Optional<Timer>;

  const debounced = function(this: unknown, ...args: T) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      fn.apply(this, args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}

/**
 * Create a throttled version of a function.
 * Limits execution to at most once per specified wait time.
 *
 * @param fn - Function to throttle
 * @param wait - Milliseconds to wait between executions
 * @returns Throttled function with cleanup method
 */
export function throttle<T extends unknown[], R>(fn: (...args: T) => R, wait: number): TimedFunction<T> {
  let timeoutId: Optional<Timer>;
  let lastExecutionTime = 0;
  let pendingArgs: Optional<T>;
  let pendingThis: unknown;

  const throttled = function(this: unknown, ...args: T) {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionTime;

    pendingArgs = args;
    // eslint-disable-next-line unicorn/no-this-assignment
    pendingThis = this;

    if (timeSinceLastExecution >= wait) {
      lastExecutionTime = now;
      fn.apply(this, args);
      pendingArgs = undefined;
      pendingThis = undefined;
    } else if (timeoutId === undefined) {
      const remainingTime = wait - timeSinceLastExecution;
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
        lastExecutionTime = Date.now();
        if (pendingArgs !== undefined) {
          fn.apply(pendingThis, pendingArgs);
          pendingArgs = undefined;
          pendingThis = undefined;
        }
      }, remainingTime);
    }
  };

  throttled.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    pendingArgs = undefined;
    pendingThis = undefined;
  };

  return throttled;
}
