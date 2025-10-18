/**
 * Binder system for mounting and managing Volt.js bindings
 */

import { getVoltAttributes, parseClassBinding, setHTML, setText, toggleClass, walkDOM } from "./dom";
import { evaluate, type Scope } from "./evaluator";
import type { Signal } from "./signal";

/**
 * Cleanup function returned by binding handlers
 */
type CleanupFunction = () => void;

/**
 * Context object available to all bindings
 */
interface BindingContext {
  element: Element;
  scope: Scope;
  cleanups: CleanupFunction[];
}

/**
 * Mount Volt.js on a root element and its descendants.
 * Binds all data-x-* attributes to the provided scope.
 * Returns a cleanup function to unmount and dispose all bindings.
 *
 * @param root - Root element to mount on
 * @param scope - Scope object containing signals and data
 * @returns Cleanup function to unmount
 */
export function mount(root: Element, scope: Scope): CleanupFunction {
  const elements = walkDOM(root);
  const allCleanups: CleanupFunction[] = [];

  for (const element of elements) {
    const attributes = getVoltAttributes(element);
    const context: BindingContext = { element, scope, cleanups: [] };

    for (const [name, value] of attributes) {
      bindAttribute(context, name, value);
    }

    allCleanups.push(...context.cleanups);
  }

  return () => {
    for (const cleanup of allCleanups) {
      try {
        cleanup();
      } catch (error) {
        console.error("Error during unmount:", error);
      }
    }
  };
}

/**
 * Bind a single data-x-* attribute to an element.
 * Routes to the appropriate binding handler.
 *
 * @param context - Binding context
 * @param name - Attribute name (without data-x- prefix)
 * @param value - Attribute value (expression)
 */
function bindAttribute(context: BindingContext, name: string, value: string): void {
  if (name.startsWith("on-")) {
    const eventName = name.slice(3);
    bindEvent(context, eventName, value);
    return;
  }

  switch (name) {
    case "text": {
      bindText(context, value);
      break;
    }
    case "html": {
      bindHTML(context, value);
      break;
    }
    case "class": {
      bindClass(context, value);
      break;
    }
    default: {
      console.warn(`Unknown binding: data-x-${name}`);
    }
  }
}

/**
 * Bind data-x-text to update element's text content.
 * Subscribes to signals in the expression and updates on change.
 *
 * @param context - Binding context
 * @param expression - Expression to evaluate
 */
function bindText(context: BindingContext, expression: string): void {
  const update = () => {
    const value = evaluate(expression, context.scope);
    setText(context.element, value);
  };

  update();

  const signal = findSignalInScope(context.scope, expression);
  if (signal) {
    const unsubscribe = signal.subscribe(update);
    context.cleanups.push(unsubscribe);
  }
}

/**
 * Bind data-x-html to update element's HTML content.
 * Subscribes to signals in the expression and updates on change.
 *
 * @param context - Binding context
 * @param expression - Expression to evaluate
 */
function bindHTML(context: BindingContext, expression: string): void {
  const update = () => {
    const value = evaluate(expression, context.scope);
    setHTML(context.element, String(value ?? ""));
  };

  update();

  const signal = findSignalInScope(context.scope, expression);
  if (signal) {
    const unsubscribe = signal.subscribe(update);
    context.cleanups.push(unsubscribe);
  }
}

/**
 * Bind data-x-class to toggle CSS classes.
 * Supports both string and object notation.
 * Subscribes to signals in the expression and updates on change.
 *
 * @param context - Binding context
 * @param expression - Expression to evaluate
 */
function bindClass(context: BindingContext, expression: string): void {
  let previousClasses = new Map<string, boolean>();

  const update = () => {
    const value = evaluate(expression, context.scope);
    const classes = parseClassBinding(value);

    for (const [className] of previousClasses) {
      if (!classes.has(className)) {
        toggleClass(context.element, className, false);
      }
    }

    for (const [className, shouldAdd] of classes) {
      toggleClass(context.element, className, shouldAdd);
    }

    previousClasses = classes;
  };

  update();

  const signal = findSignalInScope(context.scope, expression);
  if (signal) {
    const unsubscribe = signal.subscribe(update);
    context.cleanups.push(unsubscribe);
  }
}

/**
 * Bind data-x-on-* to attach event listeners.
 * Provides $el and $event in the scope for the event handler.
 *
 * @param context - Binding context
 * @param eventName - Event name (e.g., "click", "input")
 * @param expression - Expression to evaluate when event fires
 */
function bindEvent(context: BindingContext, eventName: string, expression: string): void {
  const handler = (event: Event) => {
    const eventScope: Scope = { ...context.scope, $el: context.element, $event: event };

    try {
      const result = evaluate(expression, eventScope);
      if (typeof result === "function") {
        result(event);
      }
    } catch (error) {
      console.error(`Error in event handler (${eventName}):`, error);
    }
  };

  context.element.addEventListener(eventName, handler);

  context.cleanups.push(() => {
    context.element.removeEventListener(eventName, handler);
  });
}

/**
 * Find a signal in the scope by resolving a simple property path.
 * Returns the signal if found, otherwise undefined.
 *
 * @param scope - Scope object
 * @param path - Property path (e.g., "count" or "user.name")
 * @returns Signal if found, undefined otherwise
 */
function findSignalInScope(scope: Scope, path: string): Signal<unknown> | undefined {
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

  if (
    typeof current === "object" && current !== null && "get" in current && "set" in current && "subscribe" in current
  ) {
    return current as Signal<unknown>;
  }

  return undefined;
}
