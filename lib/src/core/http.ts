/**
 * HTTP module for declarative backend integration
 *
 * Provides HTTP request/response handling with DOM swapping capabilities for server-rendered HTML fragments and JSON responses.
 */

import type { Optional } from "$types/helpers";
import type {
  BindingContext,
  HttpMethod,
  HttpResponse,
  ParsedHttpConfig,
  PluginContext,
  RequestConfig,
  RetryConfig,
  Scope,
  SwapStrategy,
} from "$types/volt";
import { evaluate } from "./evaluator";
import { sleep } from "./shared";

/**
 * Make an HTTP request and return the parsed response
 *
 * Handles both HTML and JSON responses based on Content-Type header.
 * Throws an error for network failures or status >= 400
 *
 * @param conf - Request configuration
 * @returns Promise resolving to HttpResponse
 */
export async function request(conf: RequestConfig): Promise<HttpResponse> {
  const { method, url, headers = {}, body } = conf;

  try {
    const response = await fetch(url, { method, headers: { ...headers }, body });

    const contentType = response.headers.get("content-type") || "";
    const isHTML = contentType.includes("text/html");
    const isJSON = contentType.includes("application/json");

    let html: Optional<string>;
    let json: Optional<unknown>;

    if (isHTML) {
      html = await response.text();
    } else if (isJSON) {
      json = await response.json();
    } else {
      html = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      html,
      json,
      ok: response.ok,
    };
  } catch (error) {
    throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

type CapturedState = {
  focusPath: number[] | null;
  scrollPositions: Map<number[], { top: number; left: number }>;
  inputValues: Map<number[], string | boolean>;
};

/**
 * Capture state that should be preserved during DOM swap
 */
function captureState(root: Element): CapturedState {
  const state: CapturedState = { focusPath: null, scrollPositions: new Map(), inputValues: new Map() };

  const activeEl = document.activeElement;
  if (activeEl && root.contains(activeEl)) {
    state.focusPath = getElementPath(activeEl, root);
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let currentNode: Node | null = walker.currentNode;

  while (currentNode) {
    const el = currentNode as Element;
    const path = getElementPath(el, root);

    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      state.scrollPositions.set(path, { top: el.scrollTop, left: el.scrollLeft });
    }

    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") {
        state.inputValues.set(path, el.checked);
      } else {
        state.inputValues.set(path, el.value);
      }
    } else if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      state.inputValues.set(path, el.value);
    }

    currentNode = walker.nextNode();
  }

  return state;
}

/**
 * Get the path to an element from a root element as an array of child indices representing the path from root to element.
 */
function getElementPath(el: Element, root: Element): number[] {
  const path: number[] = [];
  let current: Element | null = el;

  while (current && current !== root) {
    const parent: Element | null = current.parentElement;
    if (!parent) break;

    const index = Array.from(parent.children).indexOf(current);
    if (index === -1) break;

    path.unshift(index);
    current = parent;
  }

  return path;
}

/**
 * Get element by path from root
 */
function getElementByPath(path: number[], root: Element): Element | null {
  let current: Element = root;

  for (const index of path) {
    const children = Array.from(current.children);
    if (index >= children.length) return null;
    current = children[index];
  }

  return current;
}

/**
 * Restore preserved state after DOM swap
 */
function restoreState(root: Element, state: CapturedState): void {
  if (state.focusPath) {
    const element = getElementByPath(state.focusPath, root);
    if (element instanceof HTMLElement) {
      element.focus();
    }
  }

  for (const [path, position] of state.scrollPositions) {
    const element = getElementByPath(path, root);
    if (element) {
      element.scrollTop = position.top;
      element.scrollLeft = position.left;
    }
  }

  for (const [path, value] of state.inputValues) {
    const element = getElementByPath(path, root);
    if (element instanceof HTMLInputElement) {
      if (element.type === "checkbox" || element.type === "radio") {
        element.checked = value as boolean;
      } else {
        element.value = value as string;
      }
    } else if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      element.value = value as string;
    }
  }
}

/**
 * Apply a swap strategy to update the DOM with new content
 *
 * Preserves focus, scroll position, and input state when using innerHTML or outerHTML strategies.
 *
 * @param target - Target element to update
 * @param content - HTML content to insert
 * @param strategy - Swap strategy to use
 */
export function swap(target: Element, content: string, strategy: SwapStrategy = "innerHTML"): void {
  const shouldPreserveState = strategy === "innerHTML" || strategy === "outerHTML";
  const state = shouldPreserveState ? captureState(target) : null;

  switch (strategy) {
    case "innerHTML": {
      target.innerHTML = content;
      if (state) restoreState(target, state);
      break;
    }
    case "outerHTML": {
      const parent = target.parentElement;
      const nextSibling = target.nextElementSibling;
      target.outerHTML = content;

      if (state && parent) {
        const newElement = nextSibling ? nextSibling.previousElementSibling : parent.lastElementChild;
        if (newElement) restoreState(newElement, state);
      }
      break;
    }
    case "beforebegin": {
      target.insertAdjacentHTML("beforebegin", content);
      break;
    }
    case "afterbegin": {
      target.insertAdjacentHTML("afterbegin", content);
      break;
    }
    case "beforeend": {
      target.insertAdjacentHTML("beforeend", content);
      break;
    }
    case "afterend": {
      target.insertAdjacentHTML("afterend", content);
      break;
    }
    case "delete": {
      target.remove();
      break;
    }
    case "none": {
      break;
    }
    default: {
      console.error(`Unknown swap strategy: ${strategy as string}`);
    }
  }
}

/**
 * Serialize a form element to FormData
 *
 * @param form - Form element to serialize
 * @returns FormData object containing form fields
 */
export function serializeForm(form: HTMLFormElement): FormData {
  return new FormData(form);
}

/**
 * Serialize a form element to JSON
 *
 * @param form - Form element to serialize
 * @returns JSON object containing form fields
 */
export function serializeFormToJSON(form: HTMLFormElement): Record<string, unknown> {
  const formData = new FormData(form);
  const object: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (Object.hasOwn(object, key)) {
      if (!Array.isArray(object[key])) {
        object[key] = [object[key]];
      }
      (object[key] as unknown[]).push(value);
    } else {
      object[key] = value;
    }
  }

  return object;
}

/**
 * Parse HTTP configuration from element attributes
 *
 * Reads data-volt-trigger, data-volt-target, data-volt-swap, data-volt-headers,
 * data-volt-retry, data-volt-retry-delay, and data-volt-indicator from the
 * element's dataset and returns parsed configuration.
 *
 * @param el - Element to parse configuration from
 * @param scope - Scope for evaluating expressions
 * @returns Parsed HTTP configuration with defaults
 */
export function parseHttpConfig(el: Element, scope: Scope): ParsedHttpConfig {
  const dataset = (el as HTMLElement).dataset;

  const trigger = dataset.voltTrigger || getDefaultTrigger(el);

  let target: string | Element = el;
  if (dataset.voltTarget) {
    const trimmed = dataset.voltTarget.trim();
    if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      target = trimmed.slice(1, -1);
    } else {
      const targetValue = evaluate(dataset.voltTarget, scope);
      if (typeof targetValue === "string") {
        target = targetValue;
      } else if (targetValue instanceof Element) {
        target = targetValue;
      }
    }
  }

  const swap = (dataset.voltSwap as SwapStrategy) || "innerHTML";

  let headers: Record<string, string> = {};
  if (dataset.voltHeaders) {
    try {
      const headersValue = evaluate(dataset.voltHeaders, scope);
      if (typeof headersValue === "object" && headersValue !== null) {
        headers = headersValue as Record<string, string>;
      }
    } catch (error) {
      console.error("Failed to parse data-volt-headers:", error);
    }
  }

  let retry: Optional<RetryConfig>;
  if (dataset.voltRetry) {
    const maxAttempts = Number.parseInt(dataset.voltRetry, 10);
    const initialDelay = dataset.voltRetryDelay ? Number.parseInt(dataset.voltRetryDelay, 10) : 1000;

    if (!Number.isNaN(maxAttempts) && maxAttempts > 0) {
      retry = { maxAttempts, initialDelay };
    }
  }

  const indicator = dataset.voltIndicator;

  return { trigger, target, swap, headers, retry, indicator };
}

/**
 * Get the default trigger event for an element
 */
function getDefaultTrigger(el: Element): string {
  if (el instanceof HTMLFormElement) {
    return "submit";
  }
  return "click";
}

/**
 * Set loading state on an element
 *
 * Sets data-volt-loading="true" attribute to indicate ongoing request.
 * Shows indicator if data-volt-indicator is set.
 *
 * @param el - Element to mark as loading
 * @param indicator - Optional indicator selector
 */
export function setLoadingState(el: Element, indicator?: string): void {
  el.setAttribute("data-volt-loading", "true");

  if (indicator) {
    showIndicator(indicator);
  }

  el.dispatchEvent(new CustomEvent("volt:loading", { detail: { element: el }, bubbles: true, cancelable: false }));
}

/**
 * Set error state on an element
 *
 * Sets data-volt-error attribute with error message.
 * Hides indicator if data-volt-indicator is set.
 *
 * @param el - Element to mark as errored
 * @param msg - Error message
 * @param indicator - Optional indicator selector
 */
export function setErrorState(el: Element, msg: string, indicator?: string): void {
  el.setAttribute("data-volt-error", msg);

  if (indicator) {
    hideIndicator(indicator);
  }

  el.dispatchEvent(
    new CustomEvent("volt:error", { detail: { element: el, message: msg }, bubbles: true, cancelable: false }),
  );
}

/**
 * Clear loading and error states from an element
 *
 * Removes data-volt-loading, data-volt-error, and data-volt-retry-attempt attributes.
 * Hides indicator if data-volt-indicator is set.
 *
 * @param el - Element to clear states from
 * @param indicator - Optional indicator selector
 */
export function clearStates(el: Element, indicator?: string): void {
  el.removeAttribute("data-volt-loading");
  el.removeAttribute("data-volt-error");
  el.removeAttribute("data-volt-retry-attempt");

  if (indicator) {
    hideIndicator(indicator);
  }

  el.dispatchEvent(new CustomEvent("volt:success", { detail: { element: el }, bubbles: true, cancelable: false }));
}

type IndicatorStrategy = "display" | "class";

const indicatorStrategies = new WeakMap<Element, IndicatorStrategy>();

/**
 * Detect the appropriate visibility strategy for an indicator element
 *
 * - If element has display: none (inline or computed), use display toggling
 * - If element has a class containing "hidden", use class toggling
 * - Otherwise, default to class toggling
 */
function detectIndicatorStrategy(el: Element): IndicatorStrategy {
  if (indicatorStrategies.has(el)) {
    return indicatorStrategies.get(el)!;
  }

  const htmlElement = el as HTMLElement;
  const inlineDisplay = htmlElement.style.display;
  const computedDisplay = window.getComputedStyle(htmlElement).display;

  if (inlineDisplay === "none" || computedDisplay === "none") {
    indicatorStrategies.set(el, "display");
    return "display";
  }

  const hasHiddenClass = Array.from(el.classList).some((cls) => cls.toLowerCase().includes("hidden"));
  if (hasHiddenClass) {
    indicatorStrategies.set(el, "class");
    return "class";
  }

  indicatorStrategies.set(el, "class");
  return "class";
}

/**
 * Show an indicator element using the appropriate visibility strategy
 */
function showIndicatorElement(el: Element): void {
  const strategy = detectIndicatorStrategy(el);
  const htmlElement = el as HTMLElement;

  if (strategy === "display") {
    htmlElement.style.display = "";
  } else {
    const hiddenClass = Array.from(el.classList).find((cls) => cls.toLowerCase().includes("hidden")) || "hidden";
    el.classList.remove(hiddenClass);
  }
}

/**
 * Hide an indicator element using the appropriate visibility strategy
 */
function hideIndicatorElement(el: Element): void {
  const strategy = detectIndicatorStrategy(el);
  const htmlElement = el as HTMLElement;

  if (strategy === "display") {
    htmlElement.style.display = "none";
  } else {
    const hiddenClass = Array.from(el.classList).find((cls) => cls.toLowerCase().includes("hidden")) || "hidden";
    el.classList.add(hiddenClass);
  }
}

/**
 * Show loading indicator(s) specified by selector
 *
 * @param selector - CSS selector for indicator element(s)
 */
export function showIndicator(selector: string): void {
  const indicators = document.querySelectorAll(selector);
  for (const indicator of indicators) {
    showIndicatorElement(indicator);
  }
}

/**
 * Hide loading indicator(s) specified by selector
 *
 * @param selector - CSS selector for indicator element(s)
 */
export function hideIndicator(selector: string): void {
  const indicators = document.querySelectorAll(selector);
  for (const indicator of indicators) {
    hideIndicatorElement(indicator);
  }
}

/**
 * Resolve target element from configuration
 *
 * @param targetConf - Target selector or element
 * @param defaultEl - Default element if target is "this" or undefined
 * @returns Resolved target element or undefined if not found
 */
function resolveTarget(targetConf: string | Element, defaultEl: Element): Optional<Element> {
  if (targetConf instanceof Element) {
    return targetConf;
  }

  if (targetConf === "this" || targetConf === "") {
    return defaultEl;
  }

  const target = document.querySelector(targetConf);
  if (!target) {
    console.warn(`Target element not found: ${targetConf}`);
    return undefined;
  }

  return target;
}

function classifyError(error: unknown): "network" | "server" | "client" | "other" {
  if (error instanceof Error && error.message.includes("HTTP")) {
    const match = error.message.match(/HTTP (\d+):/);
    if (match) {
      const status = Number.parseInt(match[1], 10);
      if (status >= 500 && status < 600) return "server";
      if (status >= 400 && status < 500) return "client";
    }
  }

  if (error instanceof Error && (error.message.includes("fetch") || error.message.includes("network"))) {
    return "network";
  }

  return "other";
}

/**
 * Determine if an error should be retried based on smart retry logic
 *
 * - Network errors: Always retry
 * - 5xx server errors: Always retry
 * - 4xx client errors: Never retry
 * - Other errors: Never retry
 */
function shouldRetry(error: unknown): boolean {
  const errorType = classifyError(error);
  return errorType === "network" || errorType === "server";
}

/**
 * Calculate retry delay based on error type and attempt number
 *
 * - Network errors: No delay (immediate retry)
 * - Server errors: Exponential backoff (initialDelay × 2^attempt)
 * - Other errors: No retry
 */
function calculateRetryDelay(error: unknown, attempt: number, initialDelay: number): number {
  const errorType = classifyError(error);

  if (errorType === "network") {
    return 0;
  }

  if (errorType === "server") {
    return initialDelay * 2 ** attempt;
  }

  return 0;
}

/**
 * Perform an HTTP request with configuration from element attributes
 *
 * Handles the full request lifecycle: loading state, request, swap, error handling, and smart retry.
 *
 * @param el - Element that triggered the request
 * @param method - HTTP method
 * @param url - Request URL
 * @param conf - Parsed HTTP configuration
 * @param body - Optional request body
 */
async function performRequest(
  el: Element,
  method: HttpMethod,
  url: string,
  conf: ParsedHttpConfig,
  body?: string | FormData,
): Promise<void> {
  const target = resolveTarget(conf.target, el);
  if (!target) {
    return;
  }

  setLoadingState(target, conf.indicator);

  let lastError: unknown;
  const maxAttempts = conf.retry ? conf.retry.maxAttempts + 1 : 1;
  const initialDelay = conf.retry?.initialDelay ?? 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        target.setAttribute("data-volt-retry-attempt", String(attempt));
        target.setAttribute("data-volt-loading", "retrying");
        target.dispatchEvent(
          new CustomEvent("volt:retry", { detail: { element: target, attempt }, bubbles: true, cancelable: false }),
        );
      }

      const response = await request({ method, url, headers: conf.headers, body });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      clearStates(target, conf.indicator);

      if (response.html !== undefined) {
        swap(target, response.html, conf.swap);
      } else if (response.json !== undefined) {
        console.warn("JSON responses are not yet integrated with signal updates. HTML response expected.");
      }

      return;
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxAttempts - 1;
      const canRetry = conf.retry && shouldRetry(error);

      if (isLastAttempt || !canRetry) {
        break;
      }

      const delay = calculateRetryDelay(error, attempt, initialDelay);
      if (delay > 0) {
        await sleep(delay);
      }
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  setErrorState(target, errorMessage, conf.indicator);
  console.error("HTTP request failed:", lastError);
}

export function bindGet(ctx: BindingContext, url: string): void {
  bindHttpMethod(ctx, "GET", url);
}

export function bindPost(ctx: BindingContext, url: string): void {
  bindHttpMethod(ctx, "POST", url);
}

export function bindPut(ctx: BindingContext, url: string): void {
  bindHttpMethod(ctx, "PUT", url);
}

export function bindPatch(ctx: BindingContext, url: string): void {
  bindHttpMethod(ctx, "PATCH", url);
}

export function bindDelete(ctx: BindingContext, url: string): void {
  bindHttpMethod(ctx, "DELETE", url);
}

/**
 * Generic HTTP method binding handler
 *
 * Attaches an event listener that triggers an HTTP request when fired & automatically serializes forms for POST/PUT/PATCH methods.
 */
function bindHttpMethod(ctx: BindingContext | PluginContext, method: HttpMethod, url: string): void {
  const config = parseHttpConfig(ctx.element, ctx.scope);
  const urlValue = evaluate(url, ctx.scope);
  const resolvedUrl = String(urlValue);

  const handler = async (event: Event) => {
    if (config.trigger === "submit" || ctx.element instanceof HTMLFormElement) {
      event.preventDefault();
    }

    let body: Optional<string | FormData>;

    if (method !== "GET" && method !== "DELETE") {
      if (ctx.element instanceof HTMLFormElement) {
        body = serializeForm(ctx.element);
      }
    }

    await performRequest(ctx.element, method, resolvedUrl, config, body);
  };

  ctx.element.addEventListener(config.trigger, handler);

  const cleanup = () => {
    ctx.element.removeEventListener(config.trigger, handler);
  };

  if ("addCleanup" in ctx) {
    ctx.addCleanup(cleanup);
  } else {
    ctx.cleanups.push(cleanup);
  }
}
