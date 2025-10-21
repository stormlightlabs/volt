/**
 * Binder system for mounting and managing Volt.js bindings
 */

import { executeSurgeEnter, executeSurgeLeave, hasSurge } from "$plugins/surge";
import type { Nullable, Optional } from "$types/helpers";
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
import { evaluate } from "./evaluator";
import { bindDelete, bindGet, bindPatch, bindPost, bindPut } from "./http";
import { execGlobalHooks, notifyBindingCreated, notifyElementMounted, notifyElementUnmounted } from "./lifecycle";
import { debounce, getModifierValue, hasModifier, parseModifiers, throttle } from "./modifiers";
import { getPlugin } from "./plugin";
import { createScopeMetadata, getPin, registerPin } from "./scope-metadata";
import { createArc, createProbe, createPulse, createUid } from "./scope-vars";
import { findScopedSignal, isNil, updateAndRegister } from "./shared";
import { getStore } from "./store";

/**
 * Mount Volt.js on a root element and its descendants and binds all data-volt-* attributes to the provided scope.
 *
 * @param root - Root element to mount on
 * @param scope - Scope object containing signals and data
 * @returns Cleanup function to unmount and dispose all bindings.
 */
export function mount(root: Element, scope: Scope): CleanupFunction {
  injectSpecialVars(scope, root);
  execGlobalHooks("beforeMount", root, scope);

  const allElements = walkDOM(root);

  const elements = allElements.filter((element) => {
    let current: Nullable<Element> = element;
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
    case "pin": {
      bindPin(ctx, value);
      break;
    }
    case "init": {
      bindInit(ctx, value);
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
    updateAndRegister(ctx, update, expr);
  };
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

  updateAndRegister(ctx, update, expr);
}

/**
 * Bind data-volt-show to toggle element visibility via CSS display property.
 * Unlike data-volt-if, this keeps the element in the DOM and toggles display: none.
 * Integrates with surge plugin for smooth transitions when available.
 */
function bindShow(ctx: BindingContext, expr: string): void {
  const el = ctx.element as HTMLElement;
  const originalInlineDisplay = el.style.display;
  const hasSurgeTransition = hasSurge(el);

  if (!hasSurgeTransition) {
    const update = () => {
      const value = evaluate(expr, ctx.scope);
      const shouldShow = Boolean(value);

      if (shouldShow) {
        el.style.display = originalInlineDisplay;
      } else {
        el.style.display = "none";
      }
    };

    updateAndRegister(ctx, update, expr);
    return;
  }

  let isVisible = el.style.display !== "none";
  let isTransitioning = false;

  const update = () => {
    const value = evaluate(expr, ctx.scope);
    const shouldShow = Boolean(value);

    if (shouldShow === isVisible || isTransitioning) {
      return;
    }

    isTransitioning = true;

    requestAnimationFrame(() => {
      void (async () => {
        try {
          if (shouldShow) {
            el.style.display = originalInlineDisplay;
            await executeSurgeEnter(el);
            isVisible = true;
          } else {
            await executeSurgeLeave(el);
            el.style.display = "none";
            isVisible = false;
          }
        } finally {
          isTransitioning = false;
        }
      })();
    });
  };

  updateAndRegister(ctx, update, expr);
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

  updateAndRegister(ctx, update, expr);
}

function extractStatements(expr: string) {
  const statements: string[] = [];
  let current = "";
  let depth = 0;
  let inString: string | null = null;

  for (const [i, char] of [...expr].entries()) {
    const prev = i > 0 ? expr[i - 1] : "";

    if ((char === "\"" || char === "'") && prev !== "\\") {
      if (inString === char) {
        inString = null;
      } else if (inString === null) {
        inString = char;
      }
    }

    if (inString === null) {
      if (char === "(" || char === "{" || char === "[") {
        depth++;
      } else if (char === ")" || char === "}" || char === "]") {
        depth--;
      }
    }

    if (char === ";" && depth === 0 && inString === null) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
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
      const statements = extractStatements(expr);
      let result: unknown;
      for (const stmt of statements) {
        result = evaluate(stmt, eventScope);
      }

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

  updateAndRegister(ctx, update, expr);
}

/**
 * Bind data-volt-init to run initialization code once when the element is mounted.
 */
function bindInit(ctx: BindingContext, expr: string): void {
  try {
    const statements = extractStatements(expr);
    for (const stmt of statements) {
      evaluate(stmt, ctx.scope);
    }
  } catch (error) {
    console.error("Error in data-volt-init:", error);
  }
}

/**
 * Bind data-volt-pin to register an element reference in the scope's pin registry.
 * Makes the element accessible via $pins.name ($pins[name]) in expressions and event handlers.
 *
 * @example
 * ```html
 * <input data-volt-pin="username" />
 * <button data-volt-on-click="$pins.username.focus()">Focus Input</button>
 * ```
 */
function bindPin(ctx: BindingContext, name: string): void {
  registerPin(ctx.scope, name, ctx.element);
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
  const templ = ctx.element as HTMLElement;
  const parent = templ.parentElement;

  if (!parent) {
    console.error("data-volt-for element must have a parent");
    return;
  }

  const placeholder = document.createComment(`for: ${expr}`);
  templ.before(placeholder);
  templ.remove();

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
      const clone = templ.cloneNode(true) as Element;
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

  updateAndRegister(ctx, render, expr);

  ctx.cleanups.push(() => {
    for (const cleanup of renderedCleanups) {
      cleanup();
    }
  });
}

/**
 * Bind data-volt-if to conditionally render an element. Supports data-volt-else on the next sibling element.
 * Subscribes to condition signal and shows/hides elements when condition changes.
 * Integrates with surge plugin for smooth enter/leave transitions when available.
 */
function bindIf(ctx: BindingContext, expr: string): void {
  const ifTempl = ctx.element as HTMLElement;
  const parent = ifTempl.parentElement;

  if (!parent) {
    console.error("data-volt-if element must have a parent");
    return;
  }

  let elseTempl: Optional<HTMLElement>;
  let nextSibling = ifTempl.nextElementSibling;

  while (nextSibling && nextSibling.nodeType !== 1) {
    nextSibling = nextSibling.nextElementSibling;
  }

  if (nextSibling && Object.hasOwn((nextSibling as HTMLElement).dataset, "voltElse")) {
    elseTempl = nextSibling as HTMLElement;
    elseTempl.remove();
  }

  const placeholder = document.createComment(`if: ${expr}`);
  ifTempl.before(placeholder);
  ifTempl.remove();

  const ifHasSurge = hasSurge(ifTempl);
  const elseHasSurge = elseTempl ? hasSurge(elseTempl) : false;
  const anySurge = ifHasSurge || elseHasSurge;

  let currentElement: Optional<Element>;
  let currentCleanup: Optional<CleanupFunction>;
  let currentBranch: Optional<"if" | "else">;
  let isTransitioning = false;

  const render = () => {
    const condition = evaluate(expr, ctx.scope);
    const shouldShow = Boolean(condition);

    const targetBranch = shouldShow ? "if" : (elseTempl ? "else" : undefined);

    if (targetBranch === currentBranch || isTransitioning) {
      return;
    }

    if (!anySurge) {
      if (currentCleanup) {
        currentCleanup();
        currentCleanup = undefined;
      }
      if (currentElement) {
        currentElement.remove();
        currentElement = undefined;
      }

      if (targetBranch === "if") {
        currentElement = ifTempl.cloneNode(true) as Element;
        delete (currentElement as HTMLElement).dataset.voltIf;
        currentCleanup = mount(currentElement, ctx.scope);
        placeholder.before(currentElement);
        currentBranch = "if";
      } else if (targetBranch === "else" && elseTempl) {
        currentElement = elseTempl.cloneNode(true) as Element;
        delete (currentElement as HTMLElement).dataset.voltElse;
        currentCleanup = mount(currentElement, ctx.scope);
        placeholder.before(currentElement);
        currentBranch = "else";
      } else {
        currentBranch = undefined;
      }
      return;
    }

    isTransitioning = true;

    requestAnimationFrame(() => {
      void (async () => {
        try {
          if (currentElement) {
            const currentEl = currentElement as HTMLElement;
            const currentHasSurge = currentBranch === "if" ? ifHasSurge : elseHasSurge;

            if (currentHasSurge) {
              await executeSurgeLeave(currentEl);
            }

            if (currentCleanup) {
              currentCleanup();
              currentCleanup = undefined;
            }
            currentElement.remove();
            currentElement = undefined;
          }

          if (targetBranch === "if") {
            currentElement = ifTempl.cloneNode(true) as Element;
            delete (currentElement as HTMLElement).dataset.voltIf;
            placeholder.before(currentElement);

            if (ifHasSurge) {
              await executeSurgeEnter(currentElement as HTMLElement);
            }

            currentCleanup = mount(currentElement, ctx.scope);
            currentBranch = "if";
          } else if (targetBranch === "else" && elseTempl) {
            currentElement = elseTempl.cloneNode(true) as Element;
            delete (currentElement as HTMLElement).dataset.voltElse;
            placeholder.before(currentElement);

            if (elseHasSurge) {
              await executeSurgeEnter(currentElement as HTMLElement);
            }

            currentCleanup = mount(currentElement, ctx.scope);
            currentBranch = "else";
          } else {
            currentBranch = undefined;
          }
        } finally {
          isTransitioning = false;
        }
      })();
    });
  };

  updateAndRegister(ctx, render, expr);

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

/**
 * Inject special variables ($store, $origin, $scope, $pins, $pulse, $uid, $arc, $probe)
 * into the scope for this root element.
 *
 * Creates scope metadata and makes runtime utilities available in expressions.
 * We create a Proxy for $pins that dynamically reads from metadata to ensure pins registered later are immediately accessible
 */
function injectSpecialVars(scope: Scope, root: Element): void {
  createScopeMetadata(scope, root);

  scope.$store = getStore();
  scope.$pulse = createPulse();
  scope.$origin = root;
  scope.$scope = scope;

  scope.$pins = new Proxy({}, {
    get(_target, prop: string) {
      if (typeof prop === "string") {
        return getPin(scope, prop);
      }
      return void 0;
    },
    has(_target, prop: string) {
      if (typeof prop === "string") {
        return getPin(scope, prop) !== undefined;
      }
      return false;
    },
  });

  scope.$uid = createUid(scope);
  scope.$arc = createArc(root);
  scope.$probe = createProbe(scope);
}
