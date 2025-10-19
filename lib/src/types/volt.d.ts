export type CleanupFunction = () => void;

export type Scope = Record<string, unknown>;

/**
 * Context object available to all bindings
 */
export type BindingContext = { element: Element; scope: Scope; cleanups: CleanupFunction[] };

/**
 * Context object provided to plugin handlers.
 * Contains utilities and references for implementing custom bindings.
 */
export interface PluginContext {
  /**
   * The DOM element the plugin is bound to
   */
  element: Element;

  /**
   * The scope object containing signals and data
   */
  scope: Scope;

  /**
   * Register a cleanup function to be called on unmount.
   * Plugins should use this to clean up subscriptions, event listeners, etc.
   */
  addCleanup(fn: CleanupFunction): void;

  /**
   * Find a signal in the scope by property path.
   * Returns undefined if not found or if the value is not a signal.
   */
  findSignal(path: string): Signal<unknown> | undefined;

  /**
   * Evaluate an expression against the scope.
   * Handles simple property paths, literals, and signal unwrapping.
   */
  evaluate(expression: string): unknown;

  /**
   * Lifecycle hooks for plugin-specific mount/unmount behavior
   */
  lifecycle: PluginLifecycle;
}

/**
 * Plugin handler function signature.
 * Receives context and the attribute value, performs binding setup.
 */
export type PluginHandler = (context: PluginContext, value: string) => void;

/**
 * A reactive primitive that notifies subscribers when its value changes.
 */
export interface Signal<T> {
  /**
   * Get the current value of the signal.
   */
  get(): T;

  /**
   * Update the signal's value.
   *
   * If the new value differs from the current value, subscribers will be notified.
   */
  set(value: T): void;

  /**
   * Subscribe to changes in the signal's value.
   *
   * The callback is invoked with the new value whenever it changes.
   *
   * Returns an unsubscribe function to remove the subscription.
   */
  subscribe(callback: (value: T) => void): () => void;
}

/**
 * A computed signal that derives its value from other signals.
 */
export interface ComputedSignal<T> {
  /**
   * Get the current computed value.
   */
  get(): T;

  /**
   * Subscribe to changes in the computed value.
   *
   * Returns an unsubscribe function to remove the subscription.
   */
  subscribe(callback: (value: T) => void): () => void;
}

/**
 * Storage adapter interface for custom persistence backends
 */
export interface StorageAdapter {
  get(key: string): Promise<unknown> | unknown;
  set(key: string, value: unknown): Promise<void> | void;
  remove(key: string): Promise<void> | void;
}

/**
 * Information about a mounted Volt root after charging
 *
 * element: The root element that was mounted
 * scope: The reactive scope created for this root
 * cleanup: Cleanup function to unmount this root
 */
export type ChargedRoot = { element: Element; scope: Scope; cleanup: CleanupFunction };

/**
 * Result of charging Volt roots
 *
 * roots: Array of all charged roots
 * cleanup: Cleanup function to unmount all roots
 */
export type ChargeResult = { roots: ChargedRoot[]; cleanup: CleanupFunction };

export type Dep = { get: () => unknown; subscribe: (callback: (value: unknown) => void) => () => void };

/**
 * Options for configuring async effects
 */
export interface AsyncEffectOptions {
  /**
   * Enable automatic AbortController integration.
   * When true, provides an AbortSignal to the effect function for canceling async operations.
   */
  abortable?: boolean;

  /**
   * Debounce delay in milliseconds.
   * Effect execution is delayed until this duration has passed without dependencies changing.
   */
  debounce?: number;

  /**
   * Throttle delay in milliseconds.
   * Effect execution is rate-limited to at most once per this duration.
   */
  throttle?: number;

  /**
   * Error handler for async effect failures.
   * Receives the error and a retry function.
   */
  onError?: (error: Error, retry: () => void) => void;

  /**
   * Number of automatic retry attempts on error.
   * Defaults to 0 (no retries).
   */
  retries?: number;

  /**
   * Delay in milliseconds between retry attempts.
   * Defaults to 0 (immediate retry).
   */
  retryDelay?: number;
}

/**
 * Async effect function signature.
 * Receives an optional AbortSignal when abortable option is enabled.
 * Can return a cleanup function or a Promise that resolves to a cleanup function.
 */
export type AsyncEffectFunction = (signal?: AbortSignal) => Promise<void | (() => void)>;

export type LifecycleHookCallback = () => void;
export type MountHookCallback = (root: Element, scope: Scope) => void;
export type UnmountHookCallback = (root: Element) => void;
export type ElementMountHookCallback = (element: Element, scope: Scope) => void;
export type ElementUnmountHookCallback = (element: Element) => void;
export type BindingHookCallback = (element: Element, bindingName: string) => void;
export type GlobalHookName = "beforeMount" | "afterMount" | "beforeUnmount" | "afterUnmount";

/**
 * Extended plugin context with lifecycle hooks
 */
export interface PluginLifecycle {
  /**
   * Register a callback to run when the plugin is initialized for an element
   */
  onMount: (callback: LifecycleHookCallback) => void;

  /**
   * Register a callback to run when the element is being unmounted
   */
  onUnmount: (callback: LifecycleHookCallback) => void;

  /**
   * Register a callback to run before the binding is created
   */
  beforeBinding: (callback: LifecycleHookCallback) => void;

  /**
   * Register a callback to run after the binding is created
   */
  afterBinding: (callback: LifecycleHookCallback) => void;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Strategies for swapping response content into the DOM
 *
 *  - innerHTML: Replace the target's inner HTML (default)
 *  - outerHTML: Replace the target element entirely
 *  - beforebegin: Insert before the target element
 *  - afterbegin: Insert at the start of the target's content
 *  - beforeend: Insert at the end of the target's content
 *  - afterend: Insert after the target element
 *  - delete: Remove the target element
 *  - none: No DOM update (for side effects only)
 */
export type SwapStrategy =
  | "innerHTML"
  | "outerHTML"
  | "beforebegin"
  | "afterbegin"
  | "beforeend"
  | "afterend"
  | "delete"
  | "none";

export type RequestConfig = {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string | FormData;
  target?: string | Element;
  swap?: SwapStrategy;
};

export type HttpResponse = {
  status: number;
  statusText: string;
  headers: Headers;
  html?: string;
  json?: unknown;
  ok: boolean;
};

/**
 * Configuration parsed from element attributes
 */
export type ParsedHttpConfig = {
  trigger: string;
  target: string | Element;
  swap: SwapStrategy;
  headers: Record<string, string>;
  retry?: RetryConfig;
  indicator?: string;
};

/**
 * Retry configuration for HTTP requests
 */
export type RetryConfig = {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number;

  /**
   * Initial delay in milliseconds before first retry
   */
  initialDelay: number;
};

export type HydrateOptions = { rootSelector?: string; skipHydrated?: boolean };

/**
 * Serialized scope data structure for SSR
 */
export type SerializedScope = Record<string, unknown>;

export type HydrateResult = ChargeResult;
