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
 * Enhanced error class with VoltX context
 *
 * Wraps original errors with rich debugging information including source, element, directive, and expression details.
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
      (Error as any).captureStackTrace(this, VoltError);
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
      level: this.level,
      directive: this.directive,
      expression: this.expression,
      timestamp: this.timestamp,
      context: this.context,
      cause: { name: this.cause.name, message: this.cause.message, stack: this.cause.stack },
      stack: this.stack,
    };
  }

  /**
   * Get a human-readable element path for debugging
   */
  public getElementPath(): string {
    if (!this.element) return "";

    const parts: string[] = [];
    let current: Element | null = this.element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        const classes = current.className.split(" ").filter((c) => c.trim()).join(".");
        if (classes) selector += `.${classes}`;
      }

      if (this.directive && current === this.element) {
        selector += `[${this.directive}]`;
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(" > ");
  }
}

let errorHandlers: ErrorHandler[] = [];
let devMode: boolean = false;

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
 * Enable development mode
 *
 * When enabled, shows visual error overlays and enhanced console messages.
 *
 * @param enabled - Whether to enable dev mode (defaults to true)
 *
 * @example
 * ```ts
 * enableDevMode(true);
 * ```
 */
export function enableDevMode(enabled: boolean = true): void {
  devMode = enabled;
}

/**
 * Check if development mode is enabled
 *
 * @returns Whether dev mode is currently enabled
 *
 * @example
 * ```ts
 * if (isDevMode()) {
 *   console.log('Running in dev mode');
 * }
 * ```
 */
export function isDevMode(): boolean {
  return devMode;
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
    logErrorToConsole(voltError);
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

  if (devMode) {
    showErrorOverlay(voltError);
  }
}

function logErrorToConsole(error: VoltError): void {
  const consoleMethod = error.level === "warn" ? console.warn : console.error;
  const levelBadge = error.level.toUpperCase();
  const timestamp = new Date(error.timestamp).toLocaleTimeString();

  consoleMethod(
    `%c[${levelBadge}]%c [${error.source}] %c${error.cause.message}`,
    `font-weight: bold; color: ${error.level === "warn" ? "orange" : (error.level === "fatal" ? "red" : "crimson")}`,
    "color: gray",
    "color: inherit",
  );

  console.group("Error Details");

  if (error.directive) {
    console.log("%cDirective:", "font-weight: bold", error.directive);
  }

  if (error.expression) {
    console.log("%cExpression:", "font-weight: bold", error.expression);
  }

  if (error.element) {
    const path = error.getElementPath();
    console.log("%cElement Path:", "font-weight: bold", path);
    console.log("%cElement:", "font-weight: bold", error.element);
  }

  if (error.context.pluginName) {
    console.log("%cPlugin:", "font-weight: bold", error.context.pluginName);
  }

  if (error.context.httpMethod && error.context.httpUrl) {
    console.log("%cHTTP Request:", "font-weight: bold", `${error.context.httpMethod} ${error.context.httpUrl}`);
    if (error.context.httpStatus) {
      console.log("%cStatus:", "font-weight: bold", error.context.httpStatus);
    }
  }

  if (error.context.hookName) {
    console.log("%cHook:", "font-weight: bold", error.context.hookName);
  }

  console.log("%cTimestamp:", "font-weight: bold", timestamp);
  console.log("%cCaused by:", "font-weight: bold", error.cause);

  console.groupEnd();
}

/**
 * @returns Number of registered error handlers
 */
export function getErrorHandlerCount(): number {
  return errorHandlers.length;
}

let overlayContainer: HTMLDivElement | null = null;
const errorStack: VoltError[] = [];
const MAX_ERRORS_DISPLAY = 5;

function showErrorOverlay(error: VoltError): void {
  if (!devMode) return;

  errorStack.push(error);

  if (errorStack.length > MAX_ERRORS_DISPLAY) {
    errorStack.shift();
  }

  if (!overlayContainer) {
    createOverlayContainer();
  }

  renderErrorStack();
}

function createOverlayContainer(): void {
  if (!document.body) return;

  overlayContainer = document.createElement("div");
  overlayContainer.dataset.voltErrorOverlay = "";
  overlayContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    max-width: 600px;
    max-height: 100vh;
    overflow-y: auto;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    padding: 16px;
    pointer-events: none;
  `;
  document.body.append(overlayContainer);
}

function renderErrorStack(): void {
  if (!overlayContainer) return;

  overlayContainer.innerHTML = "";

  if (errorStack.length === 0) {
    overlayContainer.style.display = "none";
    return;
  }

  overlayContainer.style.display = "block";

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    pointer-events: auto;
  `;

  const title = document.createElement("div");
  title.textContent = `VoltX Errors (${errorStack.length})`;
  title.style.cssText = `
    font-weight: 600;
    color: #fff;
    background: #e53e3e;
    padding: 8px 12px;
    border-radius: 4px;
  `;

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear All";
  clearBtn.style.cssText = `
    background: #4a5568;
    color: #fff;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    margin-left: 8px;
  `;
  clearBtn.addEventListener("click", clearErrorOverlay);

  header.append(title);
  header.append(clearBtn);
  overlayContainer.append(header);

  for (const error of [...errorStack].toReversed()) {
    overlayContainer.append(createErrorCard(error));
  }
}

function createErrorCard(error: VoltError): HTMLDivElement {
  const card = document.createElement("div");
  card.style.cssText = `
    background: ${error.level === "warn" ? "#fffaf0" : (error.level === "fatal" ? "#fff5f5" : "#fef2f2")};
    border-left: 4px solid ${error.level === "warn" ? "#ed8936" : (error.level === "fatal" ? "#c53030" : "#e53e3e")};
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  `;

  const levelBadge = document.createElement("span");
  levelBadge.textContent = error.level.toUpperCase();
  levelBadge.style.cssText = `
    display: inline-block;
    background: ${error.level === "warn" ? "#ed8936" : (error.level === "fatal" ? "#c53030" : "#e53e3e")};
    color: #fff;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    margin-right: 8px;
  `;

  const sourceBadge = document.createElement("span");
  sourceBadge.textContent = error.source;
  sourceBadge.style.cssText = `
    display: inline-block;
    background: #4a5568;
    color: #fff;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
  `;

  const dismissBtn = document.createElement("button");
  dismissBtn.textContent = "×";
  dismissBtn.style.cssText = `
    background: none;
    border: none;
    color: #718096;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
  `;
  dismissBtn.addEventListener("click", () => dismissError(error));

  header.append(levelBadge);
  header.append(sourceBadge);
  header.append(dismissBtn);

  const message = document.createElement("div");
  message.textContent = error.cause.message;
  message.style.cssText = `
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 8px;
  `;

  const details = document.createElement("div");
  details.style.cssText = `
    font-size: 12px;
    color: #4a5568;
    line-height: 1.5;
  `;

  const detailLines: string[] = [];

  if (error.directive) {
    detailLines.push(`Directive: ${error.directive}`);
  }

  if (error.expression) {
    const truncated = error.expression.length > 60 ? `${error.expression.slice(0, 60)}...` : error.expression;
    detailLines.push(`Expression: ${truncated}`);
  }

  if (error.element) {
    const path = error.getElementPath();
    detailLines.push(`Element: ${path}`);
  }

  if (error.context.pluginName) {
    detailLines.push(`Plugin: ${error.context.pluginName}`);
  }

  if (error.context.httpMethod && error.context.httpUrl) {
    detailLines.push(`HTTP: ${error.context.httpMethod} ${error.context.httpUrl}`);
  }

  const timestamp = new Date(error.timestamp).toLocaleTimeString();
  detailLines.push(`Time: ${timestamp}`);

  details.innerHTML = detailLines.join("<br>");

  card.append(header);
  card.append(message);
  card.append(details);

  return card;
}

function dismissError(error: VoltError): void {
  const index = errorStack.indexOf(error);
  if (index !== -1) {
    errorStack.splice(index, 1);
    renderErrorStack();
  }
}

/**
 * Clear all errors from the overlay
 */
export function clearErrorOverlay(): void {
  errorStack.length = 0;
  if (overlayContainer) {
    overlayContainer.style.display = "none";
  }
}

/**
 * Get overlay container (for testing)
 */
export function getOverlayContainer(): HTMLDivElement | null {
  return overlayContainer;
}

/**
 * Get error stack (for testing)
 */
export function getErrorStack(): VoltError[] {
  return errorStack;
}
