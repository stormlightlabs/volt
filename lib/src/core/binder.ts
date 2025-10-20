/**
 * Binder system for mounting and managing Volt.js bindings
 */

import type { Optional } from "$types/helpers";
import type {
  BindingContext,
  CleanupFunction,
  FormControlElement,
  Modifier,
  PluginContext,
  PluginHandler,
  Scope,
  Signal,
} from "$types/volt";
import { BOOLEAN_ATTRS } from "./constants";
import { getVoltAttrs, parseClassBinding, setHTML, setText, toggleClass, walkDOM } from "./dom";
import { evaluate, extractDeps } from "./evaluator";
import { bindDelete, bindGet, bindPatch, bindPost, bindPut } from "./http";
import { execGlobalHooks, notifyBindingCreated, notifyElementMounted, notifyElementUnmounted } from "./lifecycle";
import { debounce, getModifierValue, hasModifier, parseModifiers, throttle } from "./modifiers";
import { getPlugin } from "./plugin";
import { findScopedSignal, isNil } from "./shared";

/**
 * Mount Volt.js on a root element and its descendants and binds all data-volt-* attributes to the provided scope.
 *
 * @param root - Root element to mount on
 * @param scope - Scope object containing signals and data
 * @returns Cleanup function to unmount and dispose all bindings.
 */
export function mount(root: Element, scope: Scope): CleanupFunction {
  execGlobalHooks("beforeMount", root, scope);

  const allElements = walkDOM(root);

  const elements = allElements.filter((element) => {
    let current: Element | null = element;
    while (current) {
      if (Object.hasOwn((current as HTMLElement).dataset, "voltSkip")) {
        return false;
      }
      if (current === root) break;
      current = current.parentElement;
    }
    return true;
  });

  const allCleanups: CleanupFunction[] = [];
  const mountedElements: Element[] = [];

  for (const el of elements) {
    if (Object.hasOwn((el as HTMLElement).dataset, "voltCloak")) {
      delete (el as HTMLElement).dataset.voltCloak;
    }

    const attributes = getVoltAttrs(el);
    const context: BindingContext = { element: el, scope, cleanups: [] };

    if (attributes.has("for")) {
      const forExpression = attributes.get("for")!;
      bindFor(context, forExpression);
      notifyBindingCreated(el, "for");
    } else if (attributes.has("if")) {
      const ifExpression = attributes.get("if")!;
      bindIf(context, ifExpression);
      notifyBindingCreated(el, "if");
    } else {
      for (const [name, value] of attributes) {
        bindAttribute(context, name, value);
        notifyBindingCreated(el, name);
      }
    }

    notifyElementMounted(el);
    mountedElements.push(el);
    allCleanups.push(...context.cleanups);
  }

  execGlobalHooks("afterMount", root, scope);

  return () => {
    execGlobalHooks("beforeUnmount", root);

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

    execGlobalHooks("afterUnmount", root);
  };
}

function execPlugin(plugin: PluginHandler, ctx: BindingContext, val: string, base: string) {
  const pluginCtx = createPluginCtx(ctx);
  try {
    plugin(pluginCtx, val);
  } catch (error) {
    console.error(`Error in plugin "${base}":`, error);
  }
}

/**
 * Bind a single data-volt-* attribute to an element.
 * Routes to the appropriate binding handler.
 */
function bindAttribute(ctx: BindingContext, name: string, value: string): void {
  if (name.startsWith("on-")) {
    const eventSpec = name.slice(3);
    const { baseName: eventName, modifiers } = parseModifiers(eventSpec);
    bindEvent(ctx, eventName, value, modifiers);
    return;
  }

  if (name.startsWith("bind:") || name.startsWith("bind-")) {
    const attrSpec = name.slice(5);
    const { baseName: attrName, modifiers } = parseModifiers(attrSpec);
    bindAttr(ctx, attrName, value, modifiers);
    return;
  }

  if (name.includes(":")) {
    const colonIndex = name.indexOf(":");
    const pluginName = name.slice(0, colonIndex);
    const suffix = name.slice(colonIndex + 1);
    const plugin = getPlugin(pluginName);

    if (plugin) {
      const combinedVal = `${suffix}:${value}`;
      execPlugin(plugin, ctx, combinedVal, pluginName);
      return;
    }
  }

  const { baseName, modifiers } = parseModifiers(name);

  switch (baseName) {
    case "text": {
      const bindText = bindNode("text");
      bindText(ctx, value);
      break;
    }
    case "html": {
      const bindHTML = bindNode("html");
      bindHTML(ctx, value);
      break;
    }
    case "class": {
      bindClass(ctx, value);
      break;
    }
    case "show": {
      bindShow(ctx, value);
      break;
    }
    case "style": {
      bindStyle(ctx, value);
      break;
    }
    case "model": {
      bindModel(ctx, value, modifiers);
      break;
    }
    case "for": {
      bindFor(ctx, value);
      break;
    }
    // data-volt-else is a marker attribute handled by bindIf when processing data-volt-if
    case "else": {
      break;
    }
    case "get": {
      bindGet(ctx, value);
      break;
    }
    case "post": {
      bindPost(ctx, value);
      break;
    }
    case "put": {
      bindPut(ctx, value);
      break;
    }
    case "patch": {
      bindPatch(ctx, value);
      break;
    }
    case "delete": {
      bindDelete(ctx, value);
      break;
    }
    default: {
      const plugin = getPlugin(baseName);
      if (plugin) {
        execPlugin(plugin, ctx, value, baseName);
      } else {
        console.warn(`Unknown binding: data-volt-${baseName}`);
      }
    }
  }
}

/**
 * Creates a reactive binding for data-volt-text or data-volt-html that updates element content.
 * Returns a curried function that handles binding data-volt-text|html to update an element's text or html content
 * Subscribes to signals in the expression and updates on change.
 */
function bindNode(kind: "text" | "html") {
  return function(ctx: BindingContext, expr: string): void {
    const update = () => {
      const value = evaluate(expr, ctx.scope);
      if (kind === "text") {
        setText(ctx.element, value);
      } else {
        setHTML(ctx.element, String(value ?? ""));
      }
    };
    update();

    const deps = extractDeps(expr, ctx.scope);
    for (const dep of deps) {
      const unsubscribe = dep.subscribe(update);
      ctx.cleanups.push(unsubscribe);
    }
  };
}

/**
 * Helper function to execute an update function and subscribe to all signal dependencies.
 * Used by bindings that need reactive updates (class, show, style, for, if).
 */
function updateAndUnsub(ctx: BindingContext, update: () => void, expr: string) {
  update();
  const deps = extractDeps(expr, ctx.scope);
  for (const dep of deps) {
    const unsubscribe = dep.subscribe(update);
    ctx.cleanups.push(unsubscribe);
  }
}

/**
 * Bind data-volt-class to toggle CSS classes. Supports both string and object notation.
 * Subscribes to signals in the expression and updates on change.
 */
function bindClass(ctx: BindingContext, expr: string): void {
  let prevClasses = new Map<string, boolean>();

  const update = () => {
    const value = evaluate(expr, ctx.scope);
    const classes = parseClassBinding(value);

    for (const [className] of prevClasses) {
      if (!classes.has(className)) {
        toggleClass(ctx.element, className, false);
      }
    }

    for (const [className, shouldAdd] of classes) {
      toggleClass(ctx.element, className, shouldAdd);
    }

    prevClasses = classes;
  };

  updateAndUnsub(ctx, update, expr);
}

/**
 * Bind data-volt-show to toggle element visibility via CSS display property.
 * Unlike data-volt-if, this keeps the element in the DOM and toggles display: none.
 */
function bindShow(ctx: BindingContext, expr: string): void {
  const el = ctx.element as HTMLElement;
  const originalInlineDisplay = el.style.display;

  const update = () => {
    const value = evaluate(expr, ctx.scope);
    const shouldShow = Boolean(value);

    if (shouldShow) {
      el.style.display = originalInlineDisplay;
    } else {
      el.style.display = "none";
    }
  };

  updateAndUnsub(ctx, update, expr);
}

/**
 * Bind data-volt-style to reactively apply inline styles.
 * Supports
 *  - object notation {color: 'red', fontSize: '16px'}
 *  - string notation 'color: red; font-size: 16px'.
 */
function bindStyle(ctx: BindingContext, expr: string): void {
  const element = ctx.element as HTMLElement;

  const update = () => {
    const value = evaluate(expr, ctx.scope);

    if (typeof value === "object" && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        const cssKey = key.replaceAll(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

        if (isNil(val)) {
          element.style.removeProperty(cssKey);
        } else {
          try {
            element.style.setProperty(cssKey, String(val));
          } catch (error) {
            console.warn(`[Volt] Failed to set style property "${cssKey}":`, error);
          }
        }
      }
    } else if (typeof value === "string") {
      element.style.cssText = value;
    }
  };

  updateAndUnsub(ctx, update, expr);
}

/**
 * Bind data-volt-on-* to attach event listeners with support for modifiers.
 * Provides $el and $event in the scope for the event handler.
 *
 * Supported modifiers:
 * - .prevent - calls preventDefault()
 * - .stop - calls stopPropagation()
 * - .self - only trigger if event.target === element
 * - .window - attach listener to window
 * - .document - attach listener to document
 * - .once - run handler only once
 * - .debounce[.ms] - debounce handler (default 300ms)
 * - .throttle[.ms] - throttle handler (default 300ms)
 * - .passive - add passive event listener
 */
function bindEvent(ctx: BindingContext, eventName: string, expr: string, modifiers: Modifier[] = []): void {
  const executeHandler = (event: Event) => {
    const eventScope: Scope = { ...ctx.scope, $el: ctx.element, $event: event };

    try {
      const result = evaluate(expr, eventScope);
      if (typeof result === "function") {
        result(event);
      }
    } catch (error) {
      console.error(`Error in event handler (${eventName}):`, error);
    }
  };

  let wrappedExecute = executeHandler;

  if (hasModifier(modifiers, "debounce")) {
    const wait = getModifierValue(modifiers, "debounce", 300);
    const debouncedExecute = debounce(executeHandler, wait);
    wrappedExecute = debouncedExecute as typeof executeHandler;
    ctx.cleanups.push(() => debouncedExecute.cancel());
  } else if (hasModifier(modifiers, "throttle")) {
    const wait = getModifierValue(modifiers, "throttle", 300);
    const throttledExecute = throttle(executeHandler, wait);
    wrappedExecute = throttledExecute as typeof executeHandler;
    ctx.cleanups.push(() => throttledExecute.cancel());
  }

  const handler = (event: Event) => {
    if (hasModifier(modifiers, "self") && event.target !== ctx.element) {
      return;
    }

    if (hasModifier(modifiers, "prevent")) {
      event.preventDefault();
    }

    if (hasModifier(modifiers, "stop")) {
      event.stopPropagation();
    }

    wrappedExecute(event);
  };

  const target = hasModifier(modifiers, "window")
    ? globalThis
    : (hasModifier(modifiers, "document") ? document : ctx.element);

  const options: AddEventListenerOptions = {};
  if (hasModifier(modifiers, "once")) {
    options.once = true;
  }
  if (hasModifier(modifiers, "passive")) {
    options.passive = true;
  }

  target.addEventListener(eventName, handler, options);

  ctx.cleanups.push(() => {
    target.removeEventListener(eventName, handler, options);
  });
}

/**
 * Bind data-volt-model for two-way data binding on form elements with support for modifiers.
 * Syncs the signal value with the input value bidirectionally.
 *
 * Supported modifiers:
 * - .number - coerces values to numbers
 * - .trim - removes surrounding whitespace
 * - .lazy - syncs on 'change' instead of 'input'
 * - .debounce[.ms] - debounces signal updates (default 300ms)
 */
function bindModel(context: BindingContext, signalPath: string, modifiers: Modifier[] = []): void {
  const signal = findScopedSignal(context.scope, signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for data-volt-model`);
    return;
  }

  const element = context.element as FormControlElement;
  const type = element instanceof HTMLInputElement ? element.type : null;
  const initialValue = signal.get();
  setElementValue(element, initialValue, type);

  const unsubscribe = signal.subscribe(() => {
    const value = signal.get();
    setElementValue(element, value, type);
  });
  context.cleanups.push(unsubscribe);

  const isLazy = hasModifier(modifiers, "lazy");
  const isNumber = hasModifier(modifiers, "number");
  const isTrim = hasModifier(modifiers, "trim");

  const defaultEventName = type === "checkbox" || type === "radio" ? "change" : "input";
  const eventName = isLazy ? "change" : defaultEventName;

  const baseHandler = () => {
    let value = getElementValue(element, type);

    if (typeof value === "string") {
      if (isTrim) {
        value = value.trim();
      }
      if (isNumber) {
        value = value === "" ? Number.NaN : Number(value);
      }
    }

    (signal as Signal<unknown>).set(value);
  };

  let handler = baseHandler;

  if (hasModifier(modifiers, "debounce")) {
    const wait = getModifierValue(modifiers, "debounce", 300);
    const debouncedHandler = debounce(baseHandler, wait);
    handler = debouncedHandler as typeof baseHandler;
    context.cleanups.push(() => debouncedHandler.cancel());
  }

  element.addEventListener(eventName, handler);
  context.cleanups.push(() => {
    element.removeEventListener(eventName, handler);
  });
}

function setElementValue(el: FormControlElement, value: unknown, type: string | null): void {
  if (el instanceof HTMLInputElement) {
    switch (type) {
      case "checkbox": {
        el.checked = Boolean(value);
        break;
      }
      case "radio": {
        el.checked = el.value === String(value);
        break;
      }
      case "number": {
        el.value = String(value ?? "");
        break;
      }
      default: {
        el.value = String(value ?? "");
      }
    }
  } else if (el instanceof HTMLSelectElement) {
    el.value = String(value ?? "");
  } else if (el instanceof HTMLTextAreaElement) {
    el.value = String(value ?? "");
  }
}

function getElementValue(el: FormControlElement, type: string | null): unknown {
  if (el instanceof HTMLInputElement) {
    if (type === "checkbox") {
      return el.checked;
    }
    if (type === "number") {
      return el.valueAsNumber;
    }
    return el.value;
  }

  if (el instanceof HTMLSelectElement) {
    return el.value;
  }

  if (el instanceof HTMLTextAreaElement) {
    return el.value;
  }

  return "";
}

/**
 * Bind data-volt-bind:attr for generic attribute binding with support for modifiers.
 * Updates any HTML attribute reactively based on expression value.
 *
 * Supported modifiers:
 * - .number - coerces values to numbers
 * - .trim - removes surrounding whitespace
 */
function bindAttr(ctx: BindingContext, attrName: string, expr: string, modifiers: Modifier[] = []): void {
  const isNumber = hasModifier(modifiers, "number");
  const isTrim = hasModifier(modifiers, "trim");

  const update = () => {
    let value = evaluate(expr, ctx.scope);

    if (typeof value === "string") {
      if (isTrim) {
        value = value.trim();
      }
      if (isNumber) {
        value = value === "" ? Number.NaN : Number(value);
      }
    }

    const booleanAttrs = new Set(BOOLEAN_ATTRS);

    if (booleanAttrs.has(attrName)) {
      if (value) {
        ctx.element.setAttribute(attrName, "");
      } else {
        ctx.element.removeAttribute(attrName);
      }
    } else {
      if (isNil(value) || value === false) {
        ctx.element.removeAttribute(attrName);
      } else {
        ctx.element.setAttribute(attrName, String(value));
      }
    }
  };

  update();

  const deps = extractDeps(expr, ctx.scope);
  for (const dep of deps) {
    const unsubscribe = dep.subscribe(update);
    ctx.cleanups.push(unsubscribe);
  }
}

/**
 * Bind data-volt-for to render a list of items.
 * Subscribes to array signal and re-renders when array changes.
 */
function bindFor(ctx: BindingContext, expr: string): void {
  const parsed = parseForExpr(expr);
  if (!parsed) {
    console.error(`Invalid data-volt-for expression: "${expr}"`);
    return;
  }

  const { itemName, indexName, arrayPath } = parsed;
  const template = ctx.element as HTMLElement;
  const parent = template.parentElement;

  if (!parent) {
    console.error("data-volt-for element must have a parent");
    return;
  }

  const placeholder = document.createComment(`for: ${expr}`);
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

    const arrayValue = evaluate(arrayPath, ctx.scope);
    if (!Array.isArray(arrayValue)) {
      return;
    }

    for (const [index, item] of arrayValue.entries()) {
      const clone = template.cloneNode(true) as Element;
      delete (clone as HTMLElement).dataset.voltFor;

      const itemScope: Scope = { ...ctx.scope, [itemName]: item };
      if (indexName) {
        itemScope[indexName] = index;
      }

      const cleanup = mount(clone, itemScope);
      renderedCleanups.push(cleanup);
      renderedElements.push(clone);

      placeholder.before(clone);
    }
  };

  updateAndUnsub(ctx, render, expr);

  ctx.cleanups.push(() => {
    for (const cleanup of renderedCleanups) {
      cleanup();
    }
  });
}

/**
 * Bind data-volt-if to conditionally render an element. Supports data-volt-else on the next sibling element.
 * Subscribes to condition signal and shows/hides elements when condition changes.
 */
function bindIf(ctx: BindingContext, expr: string): void {
  const ifTemplate = ctx.element as HTMLElement;
  const parent = ifTemplate.parentElement;

  if (!parent) {
    console.error("data-volt-if element must have a parent");
    return;
  }

  let elseTemplate: Optional<HTMLElement>;
  let nextSibling = ifTemplate.nextElementSibling;

  while (nextSibling && nextSibling.nodeType !== 1) {
    nextSibling = nextSibling.nextElementSibling;
  }

  if (nextSibling && Object.hasOwn((nextSibling as HTMLElement).dataset, "voltElse")) {
    elseTemplate = nextSibling as HTMLElement;
    elseTemplate.remove();
  }

  const placeholder = document.createComment(`if: ${expr}`);
  ifTemplate.before(placeholder);
  ifTemplate.remove();

  let currentElement: Optional<Element>;
  let currentCleanup: Optional<CleanupFunction>;
  let currentBranch: Optional<"if" | "else">;

  const render = () => {
    const condition = evaluate(expr, ctx.scope);
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
      currentCleanup = mount(currentElement, ctx.scope);
      placeholder.before(currentElement);
      currentBranch = "if";
    } else if (targetBranch === "else" && elseTemplate) {
      currentElement = elseTemplate.cloneNode(true) as Element;
      delete (currentElement as HTMLElement).dataset.voltElse;
      currentCleanup = mount(currentElement, ctx.scope);
      placeholder.before(currentElement);
      currentBranch = "else";
    } else {
      currentBranch = undefined;
    }
  };

  updateAndUnsub(ctx, render, expr);

  ctx.cleanups.push(() => {
    if (currentCleanup) {
      currentCleanup();
    }
  });
}

/**
 * Parse a data-volt-for expression
 * Supports: "item in items" or "(item, index) in items"
 */
function parseForExpr(expr: string): Optional<{ itemName: string; indexName?: string; arrayPath: string }> {
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
 */
function createPluginCtx(ctx: BindingContext): PluginContext {
  const mountCallbacks: Array<() => void> = [];
  const unmountCallbacks: Array<() => void> = [];
  const beforeBindingCallbacks: Array<() => void> = [];
  const afterBindingCallbacks: Array<() => void> = [];

  const lifecycle = {
    onMount: (cb: () => void) => {
      mountCallbacks.push(cb);
      try {
        cb();
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
    afterBinding: (cb: () => void) => {
      afterBindingCallbacks.push(cb);
      queueMicrotask(() => {
        try {
          cb();
        } catch (error) {
          console.error("Error in plugin afterBinding hook:", error);
        }
      });
    },
  };

  ctx.cleanups.push(() => {
    for (const cb of unmountCallbacks) {
      try {
        cb();
      } catch (error) {
        console.error("Error in plugin onUnmount hook:", error);
      }
    }
  });

  return {
    element: ctx.element,
    scope: ctx.scope,
    addCleanup: (fn) => {
      ctx.cleanups.push(fn);
    },
    findSignal: (path) => findScopedSignal(ctx.scope, path),
    evaluate: (expr) => evaluate(expr, ctx.scope),
    lifecycle,
  };
}
