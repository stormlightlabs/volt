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
