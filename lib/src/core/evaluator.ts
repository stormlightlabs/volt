/**
 * Safe expression evaluation using cached Function compiler
 *
 * Replaces hand-rolled parser with Function constructor for significant bundle size reduction.
 * Includes hardened scope proxy to prevent prototype pollution and auto-unwrap signals.
 */

import type { Scope } from "$types/volt";
import { DANGEROUS_GLOBALS, DANGEROUS_PROPERTIES, SAFE_GLOBALS } from "./constants";
import { isSignal } from "./shared";

/**
 * Custom error class for expression evaluation failures
 *
 * Provides context about which expression failed and the underlying cause.
 */
export class EvaluationError extends Error {
  public expr: string;
  public cause: unknown;
  constructor(expression: string, cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`Error evaluating "${expression}": ${message}`);
    this.name = "EvaluationError";
    this.expr = expression;
    this.cause = cause;
  }
}

const dangerousProps = new Set(DANGEROUS_PROPERTIES);
const dangerousGlobals = new Set(DANGEROUS_GLOBALS);
const safeGlobals = new Set(SAFE_GLOBALS);

interface WrapOptions {
  unwrapSignals: boolean;
}

const defaultWrapOptions: WrapOptions = { unwrapSignals: false };
const readWrapOptions: WrapOptions = { unwrapSignals: true };

export type EvaluateOpts = { unwrapSignals?: boolean };

/**
 * Check if a property name is dangerous and should be blocked
 */
function isDangerousProperty(key: unknown): boolean {
  if (typeof key !== "string" && typeof key !== "symbol") {
    return false;
  }
  return dangerousProps.has(String(key));
}

/**
 * Type guard to check if a Dep has a set method (is a Signal vs ComputedSignal)
 */
function hasSetMethod(
  dep: unknown,
): dep is { get: () => unknown; set: (v: unknown) => void; subscribe: (fn: () => void) => () => void } {
  return (typeof dep === "object"
    && dep !== null
    && "set" in dep
    && typeof (dep as { set?: unknown }).set === "function");
}

/**
 * Wrap a signal to behave like its value while preserving methods
 *
 * Creates a proxy that:
 * - Returns signal methods (.get, .subscribe, and .set if available) when accessed
 * - Acts like the unwrapped value for all other operations
 * - Unwraps nested signals in the value
 *
 * Handles both Signal (has set) and ComputedSignal (no set)
 */
function wrapSignal(
  signal: { get: () => unknown; subscribe: (fn: () => void) => () => void },
  options: WrapOptions,
): unknown {
  const hasSet = hasSetMethod(signal);

  const wrapper: Record<string | symbol, unknown> = {
    get: signal.get,
    subscribe: signal.subscribe,
    valueOf: () => signal.get(),
    toString: () => String(signal.get()),
    [Symbol.toPrimitive]: (_hint: string) => signal.get(),
  };

  if (hasSet) {
    wrapper.set = signal.set;
  }

  return new Proxy(wrapper, {
    get(target, prop) {
      if (isDangerousProperty(prop)) {
        return;
      }

      if (prop === "get" || prop === "subscribe") {
        return target[prop];
      }

      if (prop === "set" && hasSet) {
        return target[prop];
      }

      if (prop === "valueOf" || prop === "toString" || prop === Symbol.toPrimitive) {
        return target[prop];
      }

      const unwrapped = signal.get();
      if (unwrapped && (typeof unwrapped === "object" || typeof unwrapped === "function")) {
        const wrapped = wrapValue(unwrapped, options);
        return (wrapped as Record<string | symbol, unknown>)[prop];
      }

      if (unwrapped !== null && unwrapped !== undefined) {
        const boxed = new Object(unwrapped) as Record<string | symbol, unknown>;
        const value = Reflect.get(boxed, prop, boxed);

        if (typeof value === "function") {
          return value.bind(unwrapped);
        }

        return wrapValue(value, options);
      }

      return;
    },

    has(_target, prop) {
      if (isDangerousProperty(prop)) {
        return false;
      }

      if (prop === "get" || prop === "subscribe") {
        return true;
      }

      if (prop === "set" && hasSet) {
        return true;
      }

      const unwrapped = signal.get();
      if (unwrapped && (typeof unwrapped === "object" || typeof unwrapped === "function")) {
        return prop in unwrapped;
      }
      if (unwrapped !== null && unwrapped !== undefined) {
        const boxed = new Object(unwrapped) as Record<string | symbol, unknown>;
        return Reflect.has(boxed, prop);
      }
      return false;
    },
  }) as unknown;
}

/**
 * Wrap a value to block dangerous property access
 *
 * Wraps ALL objects to prevent prototype pollution attacks.
 * Built-in methods still work because we only block dangerous properties.
 */
function wrapValue(value: unknown, options: WrapOptions = defaultWrapOptions): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (isSignal(value)) {
    if (options.unwrapSignals) {
      return wrapValue((value as { get: () => unknown }).get(), options);
    }
    return wrapSignal(value, options);
  }

  if (typeof value !== "object" && typeof value !== "function") {
    return value;
  }

  return new Proxy(value as object, {
    get(target, prop) {
      if (isDangerousProperty(prop)) {
        return;
      }

      const result = (target as Record<string | symbol, unknown>)[prop];

      if (typeof result === "function") {
        return result.bind(target);
      }

      return wrapValue(result, options);
    },

    set(target, prop, newValue) {
      if (isDangerousProperty(prop)) {
        return true;
      }

      (target as Record<string | symbol, unknown>)[prop] = newValue;
      return true;
    },

    has(target, prop) {
      if (isDangerousProperty(prop)) {
        return false;
      }
      return prop in target;
    },
  });
}

/**
 * Create a hardened proxy around a scope object
 *
 * This proxy:
 * - Blocks access to dangerous properties (constructor, __proto__, prototype, globalThis)
 * - Auto-unwraps signals on get (transparent reactivity)
 * - Only allows access to scope properties and whitelisted globals
 * - Uses Object.create(null) to prevent prototype chain attacks
 * - Wraps all returned values to prevent nested dangerous access
 *
 * @param scope - The scope object to wrap
 * @returns Proxied scope with security hardening
 */
function createScopeProxy(scope: Scope, options: WrapOptions = defaultWrapOptions): Scope {
  const base = Object.create(null) as Scope;

  return new Proxy(base, {
    get(_target, prop) {
      const propStr = String(prop);

      if (dangerousGlobals.has(propStr)) {
        return;
      }

      if (isDangerousProperty(prop)) {
        return;
      }

      if (propStr in scope) {
        const value = scope[propStr];
        return wrapValue(value, options);
      }

      if (safeGlobals.has(propStr)) {
        return wrapValue((globalThis as Record<string, unknown>)[propStr], options);
      }

      return;
    },

    set(_target, prop, value) {
      if (isDangerousProperty(prop)) {
        return true;
      }

      const propStr = String(prop);

      if (propStr in scope) {
        const existing = scope[propStr];
        if (isSignal(existing) && hasSetMethod(existing)) {
          existing.set(value);
          return true;
        }
      }

      scope[propStr] = value;
      return true;
    },

    /**
     * Always return true to prevent 'with' statement from falling back to outer scope
     */
    has(_target, prop) {
      if (prop === "$unwrap") {
        return false;
      }
      return true;
    },

    ownKeys(_target) {
      return Object.keys(scope).filter((key) => !isDangerousProperty(key));
    },

    getOwnPropertyDescriptor(_target, prop) {
      if (isDangerousProperty(prop)) {
        return;
      }

      const propStr = String(prop);

      if (propStr in scope) {
        return { configurable: true, enumerable: true, writable: true, value: scope[propStr] };
      }

      return;
    },
  });
}

/**
 * Cache for compiled expression functions
 *
 * Key: expression string
 * Value: compiled function
 */
type CompiledExpr = (scope: Scope, unwrap: (value: unknown) => unknown) => unknown;

const exprCache = new Map<string, CompiledExpr>();

function isIdentifierStart(char: string): boolean {
  if (char.length === 0) {
    return false;
  }
  const code = char.charCodeAt(0);
  return ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || char === "_" || char === "$");
}

function isIdentifierPart(char: string): boolean {
  if (char.length === 0) {
    return false;
  }
  const code = char.charCodeAt(0);
  return ((code >= 65 && code <= 90)
    || (code >= 97 && code <= 122)
    || (code >= 48 && code <= 57)
    || char === "_" || char === "$");
}

function isWhitespace(char: string): boolean {
  return char === " " || char === "\n" || char === "\r" || char === "\t";
}

function transformExpr(expr: string): string {
  let result = "";
  let index = 0;

  while (index < expr.length) {
    const char = expr[index];

    if (char === "!") {
      const next = expr[index + 1] ?? "";

      if (next === "=") {
        result += "!";
        index += 1;
        continue;
      }

      let cursor = index + 1;
      while (cursor < expr.length && isWhitespace(expr[cursor])) {
        cursor += 1;
      }

      const identStart = expr[cursor] ?? "";
      if (!isIdentifierStart(identStart)) {
        result += "!";
        index += 1;
        continue;
      }

      let end = cursor + 1;
      while (end < expr.length && isIdentifierPart(expr.charAt(end))) {
        end += 1;
      }

      while (end < expr.length && expr[end] === ".") {
        const afterDot = expr[end + 1] ?? "";
        if (!isIdentifierStart(afterDot)) {
          break;
        }
        end += 2;
        while (end < expr.length && isIdentifierPart(expr.charAt(end))) {
          end += 1;
        }
      }

      const nextChar = expr[end] ?? "";
      if (nextChar === "(") {
        result += "!";
        index += 1;
        continue;
      }

      const identifier = expr.slice(cursor, end);
      result += "!$unwrap(" + identifier + ")";
      index = end;
      continue;
    }

    result += char;
    index += 1;
  }

  return result;
}

function unwrapMaybeSignal(value: unknown): unknown {
  if (isSignal(value)) {
    return (value as { get: () => unknown }).get();
  }
  return value;
}

/**
 * Compile an expression into a function using the Function constructor
 *
 * Uses 'with' statement to allow direct variable access from scope.
 * The with statement works because we're not in strict mode for the function body,
 * but the scope proxy ensures safety.
 *
 * @param expr - Expression string to compile
 * @param isStmt - Whether this is a statement (no return) or expression (return value)
 * @returns Compiled function
 */
function compileExpr(expr: string, isStmt = false): CompiledExpr {
  const cacheKey = `${isStmt ? "stmt" : "expr"}:${expr}`;

  let fn = exprCache.get(cacheKey);
  if (fn) {
    return fn;
  }

  try {
    const transformed = transformExpr(expr);
    if (isStmt) {
      fn = new Function("$scope", "$unwrap", `with($scope){${transformed}}`) as CompiledExpr;
    } else {
      fn = new Function("$scope", "$unwrap", `with($scope){return(${transformed})}`) as CompiledExpr;
    }
    exprCache.set(cacheKey, fn);
    return fn;
  } catch (error) {
    throw new EvaluationError(expr, error);
  }
}

/**
 * Unwrap signals at the top level only
 *
 * Unwraps direct signals and wrapped signals but preserves object/array structure.
 * This allows bindings to still track nested signals while unwrapping top-level signal results.
 */
function unwrapSignal(value: unknown): unknown {
  if (isSignal(value)) {
    return (value as { get: () => unknown }).get();
  }

  if (
    value
    && typeof value === "object"
    && typeof (value as { get?: unknown }).get === "function"
    && typeof (value as { subscribe?: unknown }).subscribe === "function"
  ) {
    return (value as { get: () => unknown }).get();
  }

  return value;
}

/**
 * Evaluate an expression against a scope object
 *
 * Supports:
 * - Literals: numbers, strings, booleans, null, undefined
 * - Operators: +, -, *, /, %, ==, !=, ===, !==, <, >, <=, >=, &&, ||, !
 * - Property access: obj.prop, obj['prop'], nested paths
 * - Ternary: condition ? trueVal : falseVal
 * - Array/object literals: [1, 2, 3], {key: value}
 * - Function calls: fn(arg1, arg2)
 * - Arrow functions: (x) => x * 2
 * - Signals auto-unwrapped
 *
 * @param expr - The expression string to evaluate
 * @param scope - The scope object containing values
 * @param opts - Evaluation options. By default, signals are unwrapped for read operations.
 *               Pass { unwrapSignals: false } to keep signals wrapped (needed for event handlers that call .set())
 * @returns The evaluated result
 * @throws EvaluationError if expression is invalid or evaluation fails
 */
export function evaluate(expr: string, scope: Scope, opts?: EvaluateOpts): unknown {
  try {
    const fn = compileExpr(expr, false);
    const wrapOptions = opts?.unwrapSignals === false ? defaultWrapOptions : readWrapOptions;
    const proxiedScope = createScopeProxy(scope, wrapOptions);
    const result = fn(proxiedScope, unwrapMaybeSignal);
    return unwrapSignal(result);
  } catch (error) {
    if (error instanceof EvaluationError) {
      throw error;
    }
    if (error instanceof ReferenceError) {
      return undefined;
    }
    throw new EvaluationError(expr, error);
  }
}

/**
 * Evaluate multiple statements against a scope object
 *
 * Used for event handlers that may contain multiple semicolon-separated statements.
 * Statements are executed in order but no return value is captured.
 * Signals are NOT unwrapped by default to allow calling .set() and other signal methods.
 *
 * @param expr - The statement(s) to evaluate
 * @param scope - The scope object containing values
 * @throws EvaluationError if evaluation fails
 */
export function evaluateStatements(expr: string, scope: Scope): void {
  try {
    const fn = compileExpr(expr, true);
    const proxiedScope = createScopeProxy(scope, defaultWrapOptions);
    fn(proxiedScope, unwrapMaybeSignal);
  } catch (error) {
    if (error instanceof EvaluationError) {
      throw error;
    }
    throw new EvaluationError(expr, error);
  }
}
