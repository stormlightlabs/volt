/**
 * Core error handling and reporting system for VoltX.js
 *
 * Provides centralized error boundary with rich contextual information
 * for debugging directives, expressions, effects, and HTTP operations.
 *
 * @module core/error
 */
import type { ErrorContext, ErrorHandler, ErrorLevel, ErrorSource } from "$types/volt";

/**
 * Base error class with VoltX context
 *
 * Wraps original errors with rich debugging information including ource, element, directive, and expression details.
 */
export class VoltError extends Error {
  /** Error source category */
  public readonly source: ErrorSource;
  /** Error severity level */
  public readonly level: ErrorLevel;
  /** DOM element where error occurred */
  public readonly element?: HTMLElement;
  /** Directive name */
  public readonly directive?: string;
  /** Expression that failed */
  public readonly expression?: string;
  /** Original error */
  public readonly cause: Error;
  /** When error occurred */
  public readonly timestamp: number;
  /** Full error context */
  public readonly context: ErrorContext;
  /** Whether propagation was stopped */
  private _stopped: boolean = false;

  constructor(cause: Error, context: ErrorContext) {
    const message = VoltError.buildMessage(cause, context);
    super(message);
    this.name = "VoltError";
    this.cause = cause;
    this.source = context.source;
    this.level = context.level ?? "error";
    this.element = context.element;
    this.directive = context.directive;
    this.expression = context.expression;
    this.context = context;
    this.timestamp = Date.now();

    // V8-specific feature
    // See: https://github.com/microsoft/TypeScript/issues/3926
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Stop propagation to subsequent error handlers
   */
  public stopPropagation(): void {
    this._stopped = true;
  }

  /**
   * Check if propagation was stopped
   */
  public get stopped(): boolean {
    return this._stopped;
  }

  private static buildMessage(cause: Error, context: ErrorContext): string {
    const parts: string[] = [];
    const level = context.level ?? "error";

    parts.push(`[${level.toUpperCase()}] [${context.source}] ${cause.message}`);

    if (context.directive) {
      parts.push(`Directive: ${context.directive}`);
    }

    if (context.expression) {
      const truncated = context.expression.length > 100 ? `${context.expression.slice(0, 100)}...` : context.expression;
      parts.push(`Expression: ${truncated}`);
    }

    if (context.pluginName) {
      parts.push(`Plugin: ${context.pluginName}`);
    }

    if (context.httpMethod && context.httpUrl) {
      parts.push(`HTTP: ${context.httpMethod} ${context.httpUrl}`);
      if (context.httpStatus) {
        parts.push(`Status: ${context.httpStatus}`);
      }
    }

    if (context.hookName) {
      parts.push(`Hook: ${context.hookName}`);
    }

    if (context.element) {
      const tag = context.element.tagName.toLowerCase();
      const id = context.element.id ? `#${context.element.id}` : "";
      const cls = context.element.className ? `.${context.element.className.split(" ").join(".")}` : "";
      parts.push(`Element: <${tag}${id}${cls}>`);
    }

    return parts.join(" | ");
  }

  /**
   * Serialize error for logging/reporting
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      source: this.source,
      level: this.level,
      directive: this.directive,
      expression: this.expression,
      timestamp: this.timestamp,
      context: this.context,
      cause: { name: this.cause.name, message: this.cause.message, stack: this.cause.stack },
      stack: this.stack,
    };
  }
}

/**
 * Error during expression evaluation
 *
 * Thrown when evaluating expressions in directives like data-volt-text, data-volt-if, or any other binding that uses the expression evaluator.
 */
export class EvaluatorError extends VoltError {
  constructor(cause: Error, context: ErrorContext) {
    super(cause, { ...context, source: "evaluator" });
    this.name = "EvaluatorError";
  }
}

/**
 * Error during directive binding
 *
 * Thrown when setting up or executing DOM bindings like data-volt-text, data-volt-class, data-volt-model, etc.
 */
export class BindingError extends VoltError {
  constructor(cause: Error, context: ErrorContext) {
    super(cause, { ...context, source: "binding" });
    this.name = "BindingError";
  }
}

/**
 * Error during effect execution
 *
 * Thrown when effects, computed signals, or async effects fail during execution or cleanup.
 */
export class EffectError extends VoltError {
  constructor(cause: Error, context: ErrorContext) {
    super(cause, { ...context, source: "effect" });
    this.name = "EffectError";
  }
}

/**
 * Error during HTTP operations
 *
 * Thrown when HTTP directives (data-volt-get, data-volt-post, etc.) encounter network errors, parsing failures, or swap strategy issues.
 */
export class HttpError extends VoltError {
  constructor(cause: Error, context: ErrorContext) {
    super(cause, { ...context, source: "http" });
    this.name = "HttpError";
  }
}

/**
 * Error in plugin execution
 *
 * Thrown when custom plugins registered via registerPlugin fail during initialization or execution.
 */
export class PluginError extends VoltError {
  constructor(cause: Error, context: ErrorContext) {
    super(cause, { ...context, source: "plugin" });
    this.name = "PluginError";
  }
}

/**
 * Error in lifecycle hooks
 *
 * Thrown when lifecycle hooks (beforeMount, afterMount, onMount, etc.) fail during execution.
 */
export class LifecycleError extends VoltError {
  constructor(cause: Error, context: ErrorContext) {
    super(cause, { ...context, source: "lifecycle" });
    this.name = "LifecycleError";
  }
}

/**
 * Error during charge/initialization
 *
 * Thrown when charge() encounters errors during auto-discovery and mounting of [data-volt] elements, or when parsing data-volt-state.
 */
export class ChargeError extends VoltError {
  constructor(cause: Error, context: ErrorContext) {
    super(cause, { ...context, source: "charge" });
    this.name = "ChargeError";
  }
}

/**
 * User-triggered error
 *
 * Errors explicitly reported by user code via the report() function
 * with source: "user".
 */
export class UserError extends VoltError {
  constructor(cause: Error, context: ErrorContext) {
    super(cause, { ...context, source: "user" });
    this.name = "UserError";
  }
}

/**
 * Global error handler registry
 */
let errorHandlers: ErrorHandler[] = [];

/**
 * Register an error handler
 *
 * Multiple handlers can be registered and will be called in registration order.
 * Handlers can call `error.stopPropagation()` to prevent subsequent handlers from being called.
 *
 * @param handler - Error handler function
 * @returns Cleanup function to unregister the handler
 *
 * @example
 * ```ts
 * const cleanup = onError((error) => {
 *   console.log('Error source:', error.source);
 *   console.log('Element:', error.element);
 *   console.log('Expression:', error.expression);
 *
 *   // Stop other handlers from running
 *   if (error.source === "http") {
 *     error.stopPropagation();
 *   }
 * });
 *
 * // Later: cleanup()
 * ```
 */
export function onError(handler: ErrorHandler): () => void {
  errorHandlers.push(handler);
  return () => {
    errorHandlers = errorHandlers.filter((h) => h !== handler);
  };
}

/**
 * Clear all registered error handlers
 *
 * Useful for testing or when you want to reset error handling state.
 *
 * @example
 * ```ts
 * clearErrorHandlers();
 * ```
 */
export function clearErrorHandlers(): void {
  errorHandlers = [];
}

/**
 * Report an error through the centralized error boundary
 *
 * This function is used both internally by VoltX and externally by user code.
 * All errors flow through this unified system.
 *
 * If no error handlers are registered, errors are logged to console as fallback.
 * Once handlers are registered, console logging is disabled.
 *
 * Error levels determine console output and behavior:
 * - warn: Non-critical issues logged with console.warn
 * - error: Recoverable errors logged with console.error (default)
 * - fatal: Unrecoverable errors logged with console.error and thrown to halt execution
 *
 * @param error - Error to report (can be Error, unknown, or string)
 * @param context - Error context with source and additional details
 *
 * @example
 * ```ts
 * // Warning for non-critical issues
 * report(err, {
 *   source: "binding",
 *   level: "warn",
 *   directive: "data-volt-deprecated"
 * });
 *
 * // Error for recoverable issues (default)
 * report(err, {
 *   source: "evaluator",
 *   level: "error",
 *   directive: "data-volt-text",
 *   expression: expression
 * });
 *
 * // Fatal error that halts execution
 * report(err, {
 *   source: "charge",
 *   level: "fatal",
 *   directive: "data-volt-state"
 * });
 * ```
 */
export function report(error: unknown, context: ErrorContext): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  const voltError = createErrorBySource(errorObj, context);

  if (errorHandlers.length === 0) {
    const logFn = voltError.level === "warn" ? console.warn : console.error;

    logFn(voltError.message);
    logFn("Caused by:", voltError.cause);
    if (voltError.element) {
      logFn("Element:", voltError.element);
    }

    if (voltError.level === "fatal") {
      throw voltError;
    }
    return;
  }

  for (const handler of errorHandlers) {
    try {
      handler(voltError);
      if (voltError.stopped) {
        break;
      }
    } catch (handlerError) {
      console.error("Error in error handler:", handlerError);
    }
  }

  if (voltError.level === "fatal") {
    throw voltError;
  }
}

/**
 * Create the appropriate error type based on the source
 */
function createErrorBySource(cause: Error, context: ErrorContext): VoltError {
  switch (context.source) {
    case "evaluator": {
      return new EvaluatorError(cause, context);
    }
    case "binding": {
      return new BindingError(cause, context);
    }
    case "effect": {
      return new EffectError(cause, context);
    }
    case "http": {
      return new HttpError(cause, context);
    }
    case "plugin": {
      return new PluginError(cause, context);
    }
    case "lifecycle": {
      return new LifecycleError(cause, context);
    }
    case "charge": {
      return new ChargeError(cause, context);
    }
    case "user": {
      return new UserError(cause, context);
    }
    default: {
      return new VoltError(cause, context);
    }
  }
}

/**
 * Get count of registered error handlers
 *
 * Useful for testing and debugging error handling setup.
 *
 * @returns Number of registered error handlers
 */
export function getErrorHandlerCount(): number {
  return errorHandlers.length;
}
