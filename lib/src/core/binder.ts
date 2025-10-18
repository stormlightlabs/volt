/**
 * Binder system for mounting and managing Volt.js bindings
 */

import type { BindingContext, CleanupFunction, PluginContext, Scope, Signal } from "$types/volt";
import { getVoltAttributes, parseClassBinding, setHTML, setText, toggleClass, walkDOM } from "./dom";
import { evaluate, extractDependencies, isSignal } from "./evaluator";
import { executeGlobalHooks, notifyBindingCreated, notifyElementMounted, notifyElementUnmounted } from "./lifecycle";
import { getPlugin } from "./plugin";

/**
 * Mount Volt.js on a root element and its descendants and binds all data-volt-* attributes to the provided scope.
 * Returns a cleanup function to unmount and dispose all bindings.
 *
 * @param root - Root element to mount on
 * @param scope - Scope object containing signals and data
 * @returns Cleanup function to unmount
 */
export function mount(root: Element, scope: Scope): CleanupFunction {
  executeGlobalHooks("beforeMount", root, scope);

  const elements = walkDOM(root);
  const allCleanups: CleanupFunction[] = [];
  const mountedElements: Element[] = [];

  for (const element of elements) {
    const attributes = getVoltAttributes(element);
    const context: BindingContext = { element, scope, cleanups: [] };

    if (attributes.has("for")) {
      const forExpression = attributes.get("for")!;
      bindFor(context, forExpression);
      notifyBindingCreated(element, "for");
    } else if (attributes.has("if")) {
      const ifExpression = attributes.get("if")!;
      bindIf(context, ifExpression);
      notifyBindingCreated(element, "if");
    } else {
      for (const [name, value] of attributes) {
        bindAttribute(context, name, value);
        notifyBindingCreated(element, name);
      }
    }

    notifyElementMounted(element);
    mountedElements.push(element);
    allCleanups.push(...context.cleanups);
  }

  executeGlobalHooks("afterMount", root, scope);

  return () => {
    executeGlobalHooks("beforeUnmount", root);

    for (const element of mountedElements) {
      notifyElementUnmounted(element);
    }

    for (const cleanup of allCleanups) {
      try {
        cleanup();
      } catch (error) {
        console.error("Error during unmount:", error);
      }
    }

    executeGlobalHooks("afterUnmount", root);
  };
}

/**
 * Bind a single data-volt-* attribute to an element.
 * Routes to the appropriate binding handler.
 *
 * @param context - Binding context
 * @param name - Attribute name (without data-volt- prefix)
 * @param value - Attribute value (expression)
 */
function bindAttribute(context: BindingContext, name: string, value: string): void {
  if (name.startsWith("on-")) {
    const eventName = name.slice(3);
    bindEvent(context, eventName, value);
    return;
  }

  if (name.startsWith("bind:")) {
    const attrName = name.slice(5);
    bindAttr(context, attrName, value);
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
    case "model": {
      bindModel(context, value);
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
        console.warn(`Unknown binding: data-volt-${name}`);
      }
    }
  }
}

/**
 * Bind data-volt-text to update element's text content.
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
 * Bind data-volt-html to update element's HTML content.
 *
 * Subscribes to signals in the expression and updates on change.
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
 * Bind data-volt-class to toggle CSS classes.
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
 * Bind data-volt-on-* to attach event listeners.
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
 * Bind data-volt-model for two-way data binding on form elements.
 * Syncs the signal value with the input value bidirectionally.
 *
 * @param context - Binding context
 * @param signalPath - Path to the signal in scope
 */
function bindModel(context: BindingContext, signalPath: string): void {
  const signal = findSignalInScope(context.scope, signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for data-volt-model`);
    return;
  }

  const element = context.element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const type = element instanceof HTMLInputElement ? element.type : null;
  const initialValue = signal.get();
  setElementValue(element, initialValue, type);

  const unsubscribe = signal.subscribe(() => {
    const value = signal.get();
    setElementValue(element, value, type);
  });
  context.cleanups.push(unsubscribe);

  const eventName = type === "checkbox" || type === "radio" ? "change" : "input";

  const handler = () => {
    const value = getElementValue(element, type);
    (signal as Signal<unknown>).set(value);
  };

  element.addEventListener(eventName, handler);
  context.cleanups.push(() => {
    element.removeEventListener(eventName, handler);
  });
}

/**
 * Set element value based on type
 */
function setElementValue(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: unknown,
  type: string | null,
): void {
  if (element instanceof HTMLInputElement) {
    switch (type) {
      case "checkbox": {
        element.checked = Boolean(value);

        break;
      }
      case "radio": {
        element.checked = element.value === String(value);
        break;
      }
      case "number": {
        element.value = String(value ?? "");
        break;
      }
      default: {
        element.value = String(value ?? "");
      }
    }
  } else if (element instanceof HTMLSelectElement) {
    element.value = String(value ?? "");
  } else if (element instanceof HTMLTextAreaElement) {
    element.value = String(value ?? "");
  }
}

/**
 * Get element value based on type
 */
function getElementValue(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  type: string | null,
): unknown {
  if (element instanceof HTMLInputElement) {
    if (type === "checkbox") {
      return element.checked;
    }
    if (type === "number") {
      return element.valueAsNumber;
    }
    return element.value;
  }

  if (element instanceof HTMLSelectElement) {
    return element.value;
  }

  if (element instanceof HTMLTextAreaElement) {
    return element.value;
  }

  return "";
}

/**
 * Bind data-volt-bind:attr for generic attribute binding.
 *
 * Updates any HTML attribute reactively based on expression value.
 */
function bindAttr(context: BindingContext, attrName: string, expression: string): void {
  const update = () => {
    const value = evaluate(expression, context.scope);

    const booleanAttrs = new Set([
      "disabled",
      "checked",
      "selected",
      "readonly",
      "required",
      "multiple",
      "autofocus",
      "autoplay",
      "controls",
      "loop",
      "muted",
    ]);

    if (booleanAttrs.has(attrName)) {
      if (value) {
        context.element.setAttribute(attrName, "");
      } else {
        context.element.removeAttribute(attrName);
      }
    } else {
      if (value === null || value === undefined || value === false) {
        context.element.removeAttribute(attrName);
      } else {
        context.element.setAttribute(attrName, String(value));
      }
    }
  };

  update();

  const dependencies = extractDependencies(expression, context.scope);
  for (const dependency of dependencies) {
    const unsubscribe = dependency.subscribe(update);
    context.cleanups.push(unsubscribe);
  }
}

/**
 * Find a signal in the scope by resolving a simple property path.
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

  if (isSignal(current)) {
    return current as Signal<unknown>;
  }

  return undefined;
}

/**
 * Bind data-volt-for to render a list of items.
 * Subscribes to array signal and re-renders when array changes.
 *
 * @param context - Binding context
 * @param expression - Expression like "item in items" or "(item, index) in items"
 */
function bindFor(context: BindingContext, expression: string): void {
  const parsed = parseForExpression(expression);
  if (!parsed) {
    console.error(`Invalid data-volt-for expression: "${expression}"`);
    return;
  }

  const { itemName, indexName, arrayPath } = parsed;
  const template = context.element as HTMLElement;
  const parent = template.parentElement;

  if (!parent) {
    console.error("data-volt-for element must have a parent");
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
      delete (clone as HTMLElement).dataset.voltFor;

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
 * Bind data-volt-if to conditionally render an element.
 * Supports data-volt-else on the next sibling element.
 * Subscribes to condition signal and shows/hides elements when condition changes.
 *
 * @param context - Binding context
 * @param expression - Expression to evaluate as condition
 */
function bindIf(context: BindingContext, expression: string): void {
  const ifTemplate = context.element as HTMLElement;
  const parent = ifTemplate.parentElement;

  if (!parent) {
    console.error("data-volt-if element must have a parent");
    return;
  }

  let elseTemplate: HTMLElement | undefined;
  let nextSibling = ifTemplate.nextElementSibling;

  while (nextSibling && nextSibling.nodeType !== 1) {
    nextSibling = nextSibling.nextElementSibling;
  }

  if (nextSibling && Object.hasOwn((nextSibling as HTMLElement).dataset, "voltElse")) {
    elseTemplate = nextSibling as HTMLElement;
    elseTemplate.remove();
  }

  const placeholder = document.createComment(`if: ${expression}`);
  ifTemplate.before(placeholder);
  ifTemplate.remove();

  let currentElement: Element | undefined;
  let currentCleanup: CleanupFunction | undefined;
  let currentBranch: "if" | "else" | undefined;

  const render = () => {
    const condition = evaluate(expression, context.scope);
    const shouldShow = Boolean(condition);

    const targetBranch = shouldShow ? "if" : (elseTemplate ? "else" : undefined);

    if (targetBranch === currentBranch) {
      return;
    }

    if (currentCleanup) {
      currentCleanup();
      currentCleanup = undefined;
    }
    if (currentElement) {
      currentElement.remove();
      currentElement = undefined;
    }

    if (targetBranch === "if") {
      currentElement = ifTemplate.cloneNode(true) as Element;
      delete (currentElement as HTMLElement).dataset.voltIf;
      currentCleanup = mount(currentElement, context.scope);
      placeholder.before(currentElement);
      currentBranch = "if";
    } else if (targetBranch === "else" && elseTemplate) {
      currentElement = elseTemplate.cloneNode(true) as Element;
      delete (currentElement as HTMLElement).dataset.voltElse;
      currentCleanup = mount(currentElement, context.scope);
      placeholder.before(currentElement);
      currentBranch = "else";
    } else {
      currentBranch = undefined;
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
 * Parse a data-volt-for expression
 *
 * Supports: "item in items" or "(item, index) in items"
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
 *
 * Provides the plugin with access to utilities and cleanup registration.
 */
function createPluginContext(bindingContext: BindingContext): PluginContext {
  const mountCallbacks: Array<() => void> = [];
  const unmountCallbacks: Array<() => void> = [];
  const beforeBindingCallbacks: Array<() => void> = [];
  const afterBindingCallbacks: Array<() => void> = [];

  const lifecycle = {
    onMount: (callback: () => void) => {
      mountCallbacks.push(callback);
      try {
        callback();
      } catch (error) {
        console.error("Error in plugin onMount hook:", error);
      }
    },
    onUnmount: (cb: () => void) => {
      unmountCallbacks.push(cb);
    },
    beforeBinding: (cb: () => void) => {
      beforeBindingCallbacks.push(cb);
      try {
        cb();
      } catch (error) {
        console.error("Error in plugin beforeBinding hook:", error);
      }
    },
    afterBinding: (callback: () => void) => {
      afterBindingCallbacks.push(callback);
      queueMicrotask(() => {
        try {
          callback();
        } catch (error) {
          console.error("Error in plugin afterBinding hook:", error);
        }
      });
    },
  };

  bindingContext.cleanups.push(() => {
    for (const cb of unmountCallbacks) {
      try {
        cb();
      } catch (error) {
        console.error("Error in plugin onUnmount hook:", error);
      }
    }
  });

  return {
    element: bindingContext.element,
    scope: bindingContext.scope,
    addCleanup: (fn) => {
      bindingContext.cleanups.push(fn);
    },
    findSignal: (path) => findSignalInScope(bindingContext.scope, path),
    evaluate: (expr) => evaluate(expr, bindingContext.scope),
    lifecycle,
  };
}
