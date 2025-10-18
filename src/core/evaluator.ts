/**
 * Safe expression evaluation of simple expressions without using eval() for bindings
 */

export type Scope = Record<string, unknown>;

/**
 * Evaluate a simple expression against a scope object.
 * Supports:
 * - Property access: "count", "user.name", "items.length"
 * - Simple literals: "true", "false", "null", "undefined"
 * - Numbers: "42", "3.14"
 * - Strings: "'hello'", '"world"'
 *
 * @param expression - The expression string to evaluate
 * @param scope - The scope object containing values
 * @returns The evaluated result
 */
export function evaluate(expression: string, scope: Scope): unknown {
  const trimmed = expression.trim();

  switch (trimmed) {
    case "true": {
      return true;
    }
    case "false": {
      return false;
    }
    case "null": {
      return null;
    }
    case "undefined": {
      return undefined;
    }
    default: {
      const numberMatch = /^-?\d+(\.\d+)?$/.exec(trimmed);
      if (numberMatch) {
        return Number(trimmed);
      }

      const stringMatch = /^(['"])(.*)\1$/.exec(trimmed);
      if (stringMatch) {
        return stringMatch[2];
      }

      return resolvePath(trimmed, scope);
    }
  }
}

/**
 * Resolve a property path in a scope object.
 * Supports nested property access like "user.profile.name".
 * Automatically unwraps signals by calling .get().
 *
 * @param path - The property path (e.g., "user.name")
 * @param scope - The scope object
 * @returns The value at that path, or undefined if not found
 */
function resolvePath(path: string, scope: Scope): unknown {
  const parts = path.split(".");
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
    return current.get();
  }

  return current;
}

/**
 * Check if a value is a Signal.
 *
 * @param value - Value to check
 * @returns true if the value is a Signal
 */
function isSignal(value: unknown): value is { get: () => unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "get" in value &&
    "set" in value &&
    "subscribe" in value &&
    typeof value.get === "function"
  );
}
