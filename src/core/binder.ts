/**
 * Binder system for mounting and managing Volt.js bindings
 */

import type { BindingContext, CleanupFunction, PluginContext, Scope, Signal } from "../types/volt";
import { getVoltAttributes, parseClassBinding, setHTML, setText, toggleClass, walkDOM } from "./dom";
import { evaluate } from "./evaluator";
import { getPlugin } from "./plugin";

/**
 * Mount Volt.js on a root element and its descendants and binds all data-x-* attributes to the provided scope.
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

    if (attributes.has("for")) {
      const forExpression = attributes.get("for")!;
      bindFor(context, forExpression);
    } else if (attributes.has("if")) {
      const ifExpression = attributes.get("if")!;
      bindIf(context, ifExpression);
    } else {
      for (const [name, value] of attributes) {
        bindAttribute(context, name, value);
      }
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
    case "for": {
      bindFor(context, value);
      break;
    }
    default: {
      const plugin = getPlugin(name);
      if (plugin) {
        const pluginContext = createPluginContext(context);
        try {
          plugin(pluginContext, value);
        } catch (error) {
          console.error(`Error in plugin "${name}":`, error);
        }
      } else {
        console.warn(`Unknown binding: data-x-${name}`);
      }
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
    typeof current === "object"
    && current !== null
    && "get" in current
    && "subscribe" in current
    && typeof (current as { get: unknown }).get === "function"
    && typeof (current as { subscribe: unknown }).subscribe === "function"
  ) {
    return current as Signal<unknown>;
  }

  return undefined;
}

/**
 * Bind data-x-for to render a list of items.
 * Subscribes to array signal and re-renders when array changes.
 *
 * @param context - Binding context
 * @param expression - Expression like "item in items" or "(item, index) in items"
 */
function bindFor(context: BindingContext, expression: string): void {
  const parsed = parseForExpression(expression);
  if (!parsed) {
    console.error(`Invalid data-x-for expression: "${expression}"`);
    return;
  }

  const { itemName, indexName, arrayPath } = parsed;
  const template = context.element as HTMLElement;
  const parent = template.parentElement;

  if (!parent) {
    console.error("data-x-for element must have a parent");
    return;
  }

  const placeholder = document.createComment(`for: ${expression}`);
  template.before(placeholder);
  template.remove();

  const renderedElements: Element[] = [];
  const renderedCleanups: CleanupFunction[] = [];

  const render = () => {
    for (const cleanup of renderedCleanups) {
      cleanup();
    }
    renderedCleanups.length = 0;

    for (const element of renderedElements) {
      element.remove();
    }
    renderedElements.length = 0;

    const arrayValue = evaluate(arrayPath, context.scope);
    if (!Array.isArray(arrayValue)) {
      return;
    }

    for (const [index, item] of arrayValue.entries()) {
      const clone = template.cloneNode(true) as Element;
      delete (clone as HTMLElement).dataset.xFor;

      const itemScope: Scope = { ...context.scope, [itemName]: item };
      if (indexName) {
        itemScope[indexName] = index;
      }

      const cleanup = mount(clone, itemScope);
      renderedCleanups.push(cleanup);
      renderedElements.push(clone);

      placeholder.before(clone);
    }
  };

  render();

  const signal = findSignalInScope(context.scope, arrayPath);
  if (signal) {
    const unsubscribe = signal.subscribe(render);
    context.cleanups.push(unsubscribe);
  }

  context.cleanups.push(() => {
    for (const cleanup of renderedCleanups) {
      cleanup();
    }
  });
}

/**
 * Bind data-x-if to conditionally render an element.
 * Subscribes to condition signal and shows/hides element when condition changes.
 *
 * @param context - Binding context
 * @param expression - Expression to evaluate as condition
 */
function bindIf(context: BindingContext, expression: string): void {
  const template = context.element as HTMLElement;
  const parent = template.parentElement;

  if (!parent) {
    console.error("data-x-if element must have a parent");
    return;
  }

  const placeholder = document.createComment(`if: ${expression}`);
  template.before(placeholder);
  template.remove();

  let currentElement: Element | undefined;
  let currentCleanup: CleanupFunction | undefined;

  const render = () => {
    const condition = evaluate(expression, context.scope);
    const shouldShow = Boolean(condition);

    if (shouldShow && !currentElement) {
      currentElement = template.cloneNode(true) as Element;
      delete (currentElement as HTMLElement).dataset.xIf;
      currentCleanup = mount(currentElement, context.scope);
      placeholder.before(currentElement);
    } else if (!shouldShow && currentElement) {
      if (currentCleanup) {
        currentCleanup();
      }
      currentElement.remove();
      currentElement = undefined;
      currentCleanup = undefined;
    }
  };

  render();

  const signal = findSignalInScope(context.scope, expression);
  if (signal) {
    const unsubscribe = signal.subscribe(render);
    context.cleanups.push(unsubscribe);
  }

  context.cleanups.push(() => {
    if (currentCleanup) {
      currentCleanup();
    }
  });
}

/**
 * Parse a data-x-for expression.
 * Supports: "item in items" or "(item, index) in items"
 *
 * @param expr - The for expression
 * @returns Parsed parts or undefined if invalid
 */
function parseForExpression(expr: string): { itemName: string; indexName?: string; arrayPath: string } | undefined {
  const trimmed = expr.trim();

  const withIndex = /^\((\w+)\s*,\s*(\w+)\)\s+in\s+(.+)$/.exec(trimmed);
  if (withIndex) {
    return { itemName: withIndex[1], indexName: withIndex[2], arrayPath: withIndex[3].trim() };
  }

  const simple = /^(\w+)\s+in\s+(.+)$/.exec(trimmed);
  if (simple) {
    return { itemName: simple[1], indexName: undefined, arrayPath: simple[2].trim() };
  }

  return undefined;
}

/**
 * Create a plugin context from a binding context.
 * Provides the plugin with access to utilities and cleanup registration.
 *
 * @param bindingContext - Internal binding context
 * @returns PluginContext for the plugin handler
 */
function createPluginContext(bindingContext: BindingContext): PluginContext {
  return {
    element: bindingContext.element,
    scope: bindingContext.scope,
    addCleanup: (fn) => {
      bindingContext.cleanups.push(fn);
    },
    findSignal: (path) => findSignalInScope(bindingContext.scope, path),
    evaluate: (expression) => evaluate(expression, bindingContext.scope),
  };
}
