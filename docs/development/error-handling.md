# Error Handling & Diagnostics

VoltX.js provides a comprehensive error handling and diagnostics system to help you debug your applications effectively.

## Severity Levels

Errors in VoltX.js are categorized by severity:

### warn

Non-critical issues that don't prevent functionality. Examples:

- Missing optional attributes
- Deprecation warnings
- Performance suggestions

### error (default)

Issues that prevent a feature from working correctly. Examples:

- Expression evaluation failures
- Invalid directive values
- Failed HTTP requests

### fatal

Critical errors that may prevent the app from functioning. Examples:

- Core system failures
- Unrecoverable state corruption

## Development Mode

Development mode provides visual error overlays and enhanced debugging output. Call `enableDevMode()` at application startup, typically in your main entry file before mounting any components:

```typescript
import { enableDevMode } from 'voltx.js';

enableDevMode(true);
```

This should be disabled in production builds for performance.

### Visual Error Overlay

When dev mode is enabled and error handlers are registered, errors appear in a visual overlay at the top-right of your application:

- Color-coded by severity level (orange for warn, red for error/fatal)
- Shows error source, directive, expression, and element path
- Displays up to 5 most recent errors
- Click × to dismiss individual errors
- Click "Clear All" to remove all errors

The overlay only appears when error handlers are registered and dev mode is enabled.

## Error Sources

VoltX.js tracks where errors originate:

- `evaluator`: Expression parsing and evaluation
- `binding`: Directive binding and DOM updates
- `effect`: Side effects and reactivity
- `http`: Network requests and responses
- `plugin`: Custom plugin errors
- `lifecycle`: Mount/unmount hook errors
- `charge`: Auto-discovery and initialization
- `user`: Application-level errors

## Enhanced Console Output

When no custom error handlers are registered, VoltX.js logs errors to the console with rich formatting:

- Color-coded severity badges
- Grouped error details
- Full element path (e.g., `div#app > button.submit[data-volt-on-click]`)
- Directive name and expression
- Timestamp and stack trace

Example console output:

```sh
[ERROR] [binding] Cannot read property 'value' of undefined
  Error Details
    Directive: data-volt-text
    Expression: user.profile.name
    Element Path: div#app > section.profile > span.name[data-volt-text]
    Element: <span class="name">
    Timestamp: 10:30:45 AM
    Caused by: TypeError: Cannot read property 'value' of undefined
```

## Custom Error Handling

The `onError()` function registers a callback that receives all errors reported by VoltX.js. This is useful for sending errors to monitoring services like Sentry or for custom logging. The function returns a cleanup callback that unregisters the handler:

```typescript
import { onError } from 'voltx.js';

const cleanup = onError((error) => {
  console.log('Error source:', error.source);
  console.log('Severity:', error.level);
  console.log('Element:', error.element);
  console.log('Expression:', error.expression);

  // Send to error tracking service
  trackError(error.toJSON());

  // Stop propagation to prevent other handlers
  if (error.source === 'http') {
    error.stopPropagation();
  }
});

// Later: cleanup()
```

The `VoltError` object provides rich context including the error source, severity level, affected DOM element, and the expression that failed.

### Error Handler Priority

Multiple handlers are invoked in registration order. Call `error.stopPropagation()` within a handler to prevent subsequent handlers from executing. This is useful when one handler fully handles an error and other handlers shouldn't process it.

## Reporting Custom Errors

Use `report()` to send application-level errors through the VoltX.js error system. This ensures errors from your custom code are handled consistently with framework errors and appear in the overlay when dev mode is enabled:

```typescript
import { report } from 'voltx.js';

try {
  myCustomLogic();
} catch (err) {
  report(err, {
    source: 'user',
    level: 'error',
    // Add custom context
    customField: 'additional information'
  });
}
```

Set the `source` to `'user'` for application errors. You can add any custom fields to the context object for additional debugging information.

## Error Context

All errors include rich contextual information:

```typescript
type ErrorContext = {
  source: ErrorSource;
  level?: ErrorLevel;  // defaults to "error"
  element?: HTMLElement;
  directive?: string;
  expression?: string;
  pluginName?: string;
  httpMethod?: string;
  httpUrl?: string;
  httpStatus?: number;
  hookName?: string;
  [key: string]: unknown;  // custom fields
};
```

## Element Paths

The `getElementPath()` method builds a CSS selector path from the error's element to the document body to help quickly locate problematic elements in your application:

```typescript
onError((error) => {
  const path = error.getElementPath();
  // Example: "div#app > form.login > button[data-volt-on-click]"
});
```

The path includes element IDs, classes, and the directive name (if applicable) to make the element easy to find in DevTools.

## Viewing the Error Overlay

During development, you may want to verify the error overlay is working correctly. The examples below show how to intentionally trigger errors.

### Trigger an Evaluation Error

This example attempts to access an undefined variable in the `data-volt-init` attribute. The error will appear in the overlay immediately when the page loads:

```html
<div data-volt
     data-volt-state='{"count": 0}'
     data-volt-init="nonExistent.method()">
  <button data-volt-on-click="undefinedVariable++">Trigger Error</button>
</div>

<script type="module">
  import { charge, enableDevMode, onError } from 'voltx.js';

  enableDevMode(true);

  // Register a handler to enable the overlay
  onError((error) => {
    console.log('Caught error:', error);
  });

  charge();
</script>
```

Note that both `enableDevMode(true)` and `onError()` are required for the overlay to display.

### Trigger Different Error Levels

This example shows how to customize error levels in your error handler. The overlay will display each error with its corresponding color (orange for warn, red for error/fatal):

```html
<div data-volt data-volt-state='{"count": 0}'>
  <button data-volt-on-click="count.set('not a number')">
    Trigger Warning
  </button>
  <button data-volt-on-click="nonExistent.value">
    Trigger Error
  </button>
  <button data-volt-on-click="undefined.critical()">
    Trigger Fatal Error
  </button>
</div>

<script type="module">
  import { charge, enableDevMode, onError, report } from 'voltx.js';

  enableDevMode(true);

  onError((error) => {
    // Customize error levels based on type
    if (error.cause.message.includes('not a number')) {
      error.context.level = 'warn';
    } else if (error.cause.message.includes('critical')) {
      error.context.level = 'fatal';
    }
  });

  charge();
</script>
```

### Trigger HTTP Errors

Clicking the button will make a request to a non-existent endpoint. HTTP errors include the request method, URL, and status code in the overlay:

```html
<div data-volt>
  <button data-volt-get="/api/nonexistent">Trigger HTTP Error</button>
</div>

<script type="module">
  import { charge, enableDevMode, onError } from 'voltx.js';

  enableDevMode(true);
  onError((error) => console.log(error));
  charge();
</script>
```

### Requirements for Overlay Display

The error overlay will only appear when **all** of the following are true:

1. Development mode is enabled via `enableDevMode(true)`
2. At least one error handler is registered via `onError()`
3. An error is reported
4. `document.body` exists

If you don't see the overlay, check that you've met all these requirements.

## Error Recovery

VoltX.js is designed to be resilient:

- Errors in one binding don't affect other bindings
- Errors in effects are caught and logged without breaking reactivity
- Errors in plugins are isolated
- Errors in lifecycle hooks don't prevent mount/unmount

## Testing Error Handling

Use `clearErrorHandlers()` in test setup and teardown to ensure a clean state between tests.
Mock the error handler with a spy to verify errors are reported correctly:

```typescript
import { clearErrorHandlers, onError, report } from 'voltx.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Error Handling', () => {
  beforeEach(() => {
    clearErrorHandlers();
  });

  afterEach(() => {
    clearErrorHandlers();
  });

  it('handles custom errors', () => {
    const handler = vi.fn();
    onError(handler);

    report(new Error('Test'), {
      source: 'user',
      level: 'warn'
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const error = handler.mock.calls[0][0];
    expect(error.level).toBe('warn');
    expect(error.source).toBe('user');
  });
});
```

The handler receives a `VoltError` instance with all context properties populated.
