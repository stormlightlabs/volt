/**
 * Scope metadata management system
 *
 * Stores metadata for each reactive scope using WeakMap to avoid polluting scope objects.
 * Metadata includes origin element, pin registry, UID counter, and optional parent reference.
 */

import type { Scope, ScopeMetadata } from "$types/volt";

/**
 * WeakMap storing metadata for each scope.
 * WeakMap ensures metadata is garbage collected when scope is no longer referenced.
 */
const scopeMetadataMap = new WeakMap<Scope, ScopeMetadata>();

/**
 * Create and store metadata for a scope.
 *
 * @param scope - The reactive scope object
 * @param origin - The root element that owns this scope
 * @param parent - Optional parent scope for debugging/inspection
 * @returns The created metadata object
 *
 * @example
 * ```ts
 * const scope = { count: signal(0) };
 * const metadata = createScopeMetadata(scope, rootElement);
 * ```
 */
export function createScopeMetadata(scope: Scope, origin: Element, parent?: Scope): ScopeMetadata {
  const metadata: ScopeMetadata = { origin, pins: new Map<string, Element>(), uidCounter: 0, parent };

  scopeMetadataMap.set(scope, metadata);
  return metadata;
}

/**
 * Get metadata for a scope.
 *
 * @param scope - The scope to get metadata for
 * @returns The metadata object, or undefined if not found
 *
 * @example
 * ```ts
 * const metadata = getScopeMetadata(scope);
 * if (metadata) {
 *   console.log('Origin element:', metadata.origin);
 * }
 * ```
 */
export function getScopeMetadata(scope: Scope): ScopeMetadata | undefined {
  return scopeMetadataMap.get(scope);
}

/**
 * Register a pinned element in the scope's pin registry.
 *
 * @param scope - The scope to register the pin in
 * @param name - The pin name
 * @param element - The element to pin
 *
 * @example
 * ```ts
 * registerPin(scope, 'submitButton', buttonElement);
 * // Later accessible via $pins.submitButton
 * ```
 */
export function registerPin(scope: Scope, name: string, element: Element): void {
  const metadata = scopeMetadataMap.get(scope);
  if (metadata) {
    metadata.pins.set(name, element);
  }
}

/**
 * Get a pinned element by name from the scope.
 *
 * @param scope - The scope to search in
 * @param name - The pin name to retrieve
 * @returns The pinned element, or undefined if not found
 *
 * @example
 * ```ts
 * const button = getPin(scope, 'submitButton');
 * if (button) {
 *   button.focus();
 * }
 * ```
 */
export function getPin(scope: Scope, name: string): Element | undefined {
  const metadata = scopeMetadataMap.get(scope);
  return metadata?.pins.get(name);
}

/**
 * Get all pins for a scope as a record object.
 * This is what gets injected as $pins in the scope.
 *
 * @param scope - The scope to get pins for
 * @returns Record mapping pin names to elements
 *
 * @example
 * ```ts
 * const pins = getPins(scope);
 * // Access as: pins.submitButton, pins.inputField, etc.
 * ```
 */
export function getPins(scope: Scope): Record<string, Element> {
  const metadata = scopeMetadataMap.get(scope);
  if (!metadata) return {};

  const pins: Record<string, Element> = {};
  for (const [name, element] of metadata.pins) {
    pins[name] = element;
  }
  return pins;
}

/**
 * Increment and return the UID counter for a scope.
 * Used internally by $uid() to generate deterministic IDs.
 *
 * @param scope - The scope to increment counter for
 * @returns The next UID number
 */
export function incrementUidCounter(scope: Scope): number {
  const metadata = scopeMetadataMap.get(scope);
  if (!metadata) return 0;

  return ++metadata.uidCounter;
}
