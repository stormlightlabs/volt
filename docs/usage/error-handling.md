# Error Handling

⚠️ Named error classes and enhanced error handling are unreleased as of writing. This documentation describes features planned for v0.6.0.

VoltX categorizes all errors by source and severity, wrapping them in named error classes with rich debugging context. This system enables precise error identification, flexible handling strategies, and seamless integration with logging services.

## Error Types

Each error source maps to a specific error class:

| Identifier       | Source      | Cause                                                                                                                               |
| ---------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `EvaluatorError` | `evaluator` | Expression evaluation fails in directives (`data-volt-text`, `data-volt-if`, etc.) or computed values                               |
| `BindingError`   | `binding`   | Directive setup or execution fails (`data-volt-model` with missing signal, invalid `data-volt-for` syntax, missing parent elements) |
| `EffectError`    | `effect`    | Effect callbacks, computed signals, or async effects fail during execution or cleanup                                               |
| `HttpError`      | `http`      | HTTP directives encounter network errors, invalid swap strategies, missing target elements, or parsing failures                     |
| `PluginError`    | `plugin`    | Custom plugin handlers fail during initialization or execution                                                                      |
| `LifecycleError` | `lifecycle` | Lifecycle hooks (`beforeMount`, `afterMount`, `onMount`, etc.) fail during execution                                                |
| `ChargeError`    | `charge`    | `charge()` encounters invalid `data-volt-state` JSON, malformed configuration, or initialization errors                             |
| `UserError`      | `user`      | User code explicitly reports errors via `report()`                                                                                  |

All error classes extend `VoltError` and set their `name` property accordingly (e.g., `error.name === "HttpError"`).

## Severity Levels

Errors have three severity levels that control console output and execution flow:

**warn** — Non-critical issues logged via `console.warn`. Execution continues. Use for deprecations, missing optional features, or recoverable configuration issues.

**error** (default) — Recoverable errors logged via `console.error`. Execution continues but the specific operation fails. Most runtime errors use this level.

**fatal** — Unrecoverable errors logged via `console.error` and then thrown, halting execution. Reserve for critical initialization failures or corrupted state.

## Error Context

Every VoltX error includes contextual metadata for debugging:

```ts
interface VoltError {
    name: string; // Error class name
    source: ErrorSource; // Error category
    level: ErrorLevel; // Severity level
    directive?: string; // Failed directive (e.g., "data-volt-text")
    expression?: string; // Failed expression
    element?: HTMLElement; // DOM element where error occurred
    cause: Error; // Original wrapped error
    timestamp: number; // Unix timestamp (ms)
    context: ErrorContext; // Full context including custom properties

    // HTTP errors only
    httpMethod?: string;
    httpUrl?: string;
    httpStatus?: number;

    // Plugin errors only
    pluginName?: string;

    // Lifecycle errors only
    hookName?: string;
}
```

## Handling Errors

### Registration

Register global error handlers with `onError()`. Handlers execute in registration order and receive all errors:

```ts
import { onError } from "voltx.js";

const cleanup = onError((error) => {
    analytics.track("error", error.toJSON());

    if (error instanceof HttpError) {
        showToast(`Request failed: ${error.cause.message}`);
    }
});

// Cleanup when done
cleanup();
```

### Propagation Control

Call `error.stopPropagation()` to prevent subsequent handlers from running:

```ts
onError((error) => {
    if (error.source === "http") {
        handleHttpError(error);
        error.stopPropagation();
    }
});

// This handler won't run for HTTP errors
onError((error) => logToConsole(error));
```

### Cleanup

Remove handlers individually via their cleanup function or clear all handlers with `clearErrorHandlers()`.

## Console Fallback

When no handlers are registered, errors log to console based on severity (`console.warn` for warn, `console.error` for error/fatal) with formatted context:

```text
[ERROR] [evaluator] Cannot read property 'foo' of undefined | Directive: data-volt-text | Expression: user.foo | Element: <div#app>
Caused by: TypeError: Cannot read property 'foo' of undefined
Element: <div id="app">...</div>
```

Fatal errors throw after logging.

## Reporting Errors

Report errors from user code using `report(error, context)`:

```ts
import { report } from "voltx.js";

try {
    processForm(formElement);
} catch (error) {
    report(error as Error, {
        source: "user",
        level: "warn",
        element: formElement as HTMLElement,
        formId: formElement.id,
    });
}
```

The `context` object accepts any custom properties beyond the standard fields.

## Serialization

All VoltX errors implement `toJSON()` for serialization to logging services or error tracking systems.

### Schema

```ts
interface SerializedVoltError {
    /** Error class name (e.g., "EvaluatorError", "HttpError") */
    name: string;
    /** Full formatted error message with context */
    message: string;
    /** Error source category */
    source:
        | "evaluator"
        | "binding"
        | "effect"
        | "http"
        | "plugin"
        | "lifecycle"
        | "charge"
        | "user";

    /** Severity level */
    level: "warn" | "error" | "fatal";
    /** Directive name (e.g., "data-volt-text") */
    directive?: string;
    /** Expression that failed */
    expression?: string;
    /** Unix timestamp in milliseconds */
    timestamp: number;
    /** Full error context including custom properties */
    context: {
        source: string;
        level?: string;
        element?: HTMLElement;
        directive?: string;
        expression?: string;
        pluginName?: string;
        httpMethod?: string;
        httpUrl?: string;
        httpStatus?: number;
        hookName?: string;
        [key: string]: unknown;
    };
    /** Original error that was wrapped */
    cause: { name: string; message: string; stack?: string; };
    /** VoltX error stack trace */
    stack?: string;
}
```

### Usage

```ts
import { onError } from "voltx.js";

onError((error) => {
    fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(error.toJSON()),
    });
});
```
