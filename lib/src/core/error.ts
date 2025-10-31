/**
 * Core error handling and reporting system for VoltX.js
 *
 * Provides centralized error boundary with rich contextual information
 * for debugging directives, expressions, effects, and HTTP operations.
 *
 * @module core/error
 */
import type { ErrorContext, ErrorHandler, ErrorSource } from "$types/volt";

/**
 * Enhanced error class with VoltX context
 *
 * Wraps original errors with rich debugging information including
 * source, element, directive, and expression details.
 */
export class VoltError extends Error {
  /** Error source category */
  public readonly source: ErrorSource;
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
    this.element = context.element;
    this.directive = context.directive;
    this.expression = context.expression;
    this.context = context;
    this.timestamp = Date.now();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this);
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

    parts.push(`[${context.source}] ${cause.message}`);

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
 * Global error handler registry
 */
let errorHandlers: ErrorHandler[] = [];

/**
 * Register an error handler
 *
 * Multiple handlers can be registered and will be called in registration order.
 * Handlers can call `error.stopPropagation()` to prevent subsequent handlers
 * from being called.
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
 * @param error - Error to report (can be Error, unknown, or string)
 * @param context - Error context with source and additional details
 *
 * @example
 * ```ts
 * // Internal usage (by VoltX)
 * try {
 *   evaluate(expression, scope);
 * } catch (err) {
 *   report(err, {
 *     source: ErrorSource.Evaluator,
 *     element: ctx.element,
 *     directive: 'data-volt-text',
 *     expression: expression
 *   });
 * }
 *
 * // External usage (by plugins/apps)
 * try {
 *   myCustomLogic();
 * } catch (err) {
 *   report(err, {
 *     source: ErrorSource.User,
 *     customContext: 'My feature failed'
 *   });
 * }
 * ```
 */
export function report(error: unknown, context: ErrorContext): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const voltError = new VoltError(errorObj, context);

  if (errorHandlers.length === 0) {
    console.error(voltError.message);
    console.error("Caused by:", voltError.cause);
    if (voltError.element) {
      console.error("Element:", voltError.element);
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
