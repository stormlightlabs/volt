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
 * Utility type to unwrap reactive proxies and get the original type.
 * Since reactive() returns a transparent proxy, this is mostly for documentation.
 */
export type UnwrapReactive<T> = T extends object ? T : never;

/**
 * Utility type for reactive arrays with enhanced type safety.
 */
export type ReactiveArray<T> = T[];

/**
 * Utility type to check if a value is reactive (has the __v_isReactive marker).
 */
export type IsReactive<T> = T extends { __v_isReactive: true } ? true : false;

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

/**
 * Element-level lifecycle tracking for per-element hooks
 */
export type ElementLifecycleState = {
  isMounted: boolean;
  bindings: Set<string>;
  onMount: Set<() => void>;
  onUnmount: Set<() => void>;
};

export type AnySignal = Signal<unknown> | ComputedSignal<unknown>;

export type GraphNode = {
  signal: AnySignal;
  id: string;
  name?: string;
  type: SignalType;
  value: unknown;
  dependencies: string[];
  dependents: string[];
};

export type DepGraph = { nodes: GraphNode[]; edges: Array<{ from: string; to: string }> };

export type SignalType = "signal" | "computed" | "reactive";

export type SignalMetadata = { id: string; type: SignalType; name?: string; createdAt: number; stackTrace?: string };

export type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Throttle/Debounced function
 */
export type TimedFunction<A extends unknown[]> = ((...args: A) => void) & { cancel: () => void };

/**
 * Represents a parsed modifier with optional numeric value
 */
export type Modifier = { name: string; value?: number };

/**
 * Result of parsing an attribute name with modifiers
 */
export type ParsedAttribute = { baseName: string; modifiers: Modifier[] };

/**
 * Registry mapping pin names to DOM elements within a scope
 */
export type PinRegistry = Map<string, Element>;

/**
 * Metadata associated with a reactive scope.
 * Stored externally via WeakMap to avoid polluting scope object.
 */
export type ScopeMetadata = {
  /**
   * The root element that owns this scope
   */
  origin: Element;

  /**
   * Registry of pinned elements (data-volt-pin)
   */
  pins: PinRegistry;

  /**
   * Counter for generating unique IDs within this scope
   */
  uidCounter: number;

  /**
   * Optional parent scope reference (for debugging/inspection)
   */
  parent?: Scope;
};

/**
 * Global reactive store interface.
 * Holds signals accessible across all scopes via $store.
 */
export interface GlobalStore {
  /**
   * Internal signal registry
   */
  readonly _signals: Map<string, Signal<unknown>>;

  /**
   * Get a signal value from the store
   */
  get<T = unknown>(key: string): T | undefined;

  /**
   * Set a signal value in the store.
   * Creates a new signal if the key doesn't exist.
   */
  set<T = unknown>(key: string, value: T): void;

  /**
   * Check if a key exists in the store
   */
  has(key: string): boolean;

  /**
   * Access signals directly (for advanced use)
   */
  [key: string]: unknown;
}

/**
 * Function signature for $pulse() - microtask scheduler
 */
export type PulseFunction = (callback: () => void) => void;

/**
 * Function signature for $uid() - unique ID generator
 */
export type UidFunction = (prefix?: string) => string;

/**
 * Function signature for $arc() - CustomEvent dispatcher
 */
export type ArcFunction = (eventName: string, detail?: unknown) => void;

/**
 * Function signature for $probe() - reactive observer
 */
export type ProbeFunction = (expression: string, callback: (value: unknown) => void) => CleanupFunction;

/**
 * Configuration for a single transition phase (enter or leave)
 */
export type TransitionPhase = {
  /**
   * Initial CSS properties (applied immediately)
   */
  from?: Record<string, string | number>;

  /**
   * Target CSS properties (animated to)
   */
  to?: Record<string, string | number>;

  /**
   * Duration in milliseconds (default: 300)
   */
  duration?: number;

  /**
   * Delay in milliseconds (default: 0)
   */
  delay?: number;

  /**
   * CSS easing function (default: 'ease')
   */
  easing?: string;

  /**
   * CSS classes to apply during this phase
   */
  classes?: string[];
};

/**
 * Complete transition preset with enter and leave phases
 */
export type TransitionPreset = {
  /**
   * Configuration for enter transition
   */
  enter: TransitionPhase;

  /**
   * Configuration for leave transition
   */
  leave: TransitionPhase;
};

/**
 * Parsed transition value with preset and modifiers
 */
export type ParsedTransition = {
  /**
   * The transition preset to use
   */
  preset: TransitionPreset;

  /**
   * Override duration from preset syntax (e.g., "fade.500")
   */
  duration?: number;

  /**
   * Override delay from preset syntax (e.g., "fade.500.100")
   */
  delay?: number;
};

/**
 * Animation preset for CSS keyframe animations
 */
export type AnimationPreset = {
  /**
   * Array of keyframes for the animation
   */
  keyframes: Keyframe[];

  /**
   * Duration in milliseconds (default: varies by preset)
   */
  duration: number;

  /**
   * Number of iterations (use Infinity for infinite)
   */
  iterations: number;

  /**
   * CSS timing function (default: "ease")
   */
  timing: string;
};

/**
 * Options for configuring a view transition
 */
export type ViewTransitionOptions = {
  /**
   * Named view transition for specific element(s)
   * Maps to view-transition-name CSS property
   */
  name?: string;

  /**
   * Elements to apply named transitions to
   * Each element will get a unique view-transition-name
   */
  elements?: HTMLElement[];

  /**
   * Skip transition if prefers-reduced-motion is enabled
   * @default true
   */
  respectReducedMotion?: boolean;

  /**
   * Force CSS fallback even if View Transitions API is supported
   * Useful for testing or debugging
   * @default false
   */
  forceFallback?: boolean;
};
