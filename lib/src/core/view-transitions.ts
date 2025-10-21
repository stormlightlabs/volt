/**
 * View Transitions API integration with CSS fallback
 * Provides progressive enhancement for smooth DOM transitions
 */

import { prefersReducedMotion } from "$core/transitions";
import type { Optional } from "$types/helpers";
import type { ViewTransitionOptions as ViewTransitionOpts } from "$types/volt";

type StartViewTransitionResult = {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCbDone: Promise<void>;
  skipTransition(): void;
};

/**
 * Extended Document type with View Transitions API support
 */
type DocumentWithViewTransition = Document & {
  startViewTransition(updateCb: () => void | Promise<void>): StartViewTransitionResult;
};

/**
 * Check if the browser supports the View Transitions API
 *
 * @returns true if document.startViewTransition is available
 */
export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/**
 * Execute a DOM update with View Transitions API.
 * Falls back to direct execution if unsupported or reduced motion is preferred.
 *
 * @param cb - Function that performs DOM updates
 * @param opts - Optional configuration for the transition
 * @returns Promise that resolves when transition completes
 *
 * @example
 * ```typescript
 * // Simple transition
 * await startViewTransition(() => {
 *   element.textContent = 'Updated!';
 * });
 *
 * // Named transition for specific element
 * await startViewTransition(() => {
 *   element.classList.add('active');
 * }, { name: 'card-flip', elements: [element] });
 * ```
 */
export async function startViewTransition(
  cb: () => void | Promise<void>,
  opts: ViewTransitionOpts = {},
): Promise<void> {
  const { respectReducedMotion = true, forceFallback = false } = opts;

  if (respectReducedMotion && prefersReducedMotion()) {
    await cb();
    return;
  }

  if (!forceFallback && supportsViewTransitions()) {
    const namedElements = applyViewTransitionNames(opts.name, opts.elements);

    try {
      const transition = (document as DocumentWithViewTransition).startViewTransition(cb);
      await transition.finished;
    } finally {
      removeViewTransitionNames(namedElements);
    }
  } else {
    await cb();
  }
}

/**
 * Execute a transition with a specific named view transition.
 * This is a convenience wrapper around startViewTransition for named transitions.
 *
 * @param name - View transition name (maps to view-transition-name CSS property)
 * @param elements - Elements to apply the named transition to
 * @param cb - Function that performs DOM updates
 * @returns Promise that resolves when transition completes
 *
 * @example
 * ```typescript
 * const card = document.querySelector('.card');
 * await namedViewTransition('card-flip', [card], () => {
 *   card.classList.toggle('flipped');
 * });
 * ```
 */
export async function namedViewTransition(
  name: string,
  elements: HTMLElement[],
  cb: () => void | Promise<void>,
): Promise<void> {
  return startViewTransition(cb, { name, elements });
}

/**
 * Apply view-transition-name CSS property to elements.
 * Returns a map of elements to their original view-transition-name values
 * for later restoration.
 *
 * @param baseName - Base name for the transition (suffixed with index if multiple elements)
 * @param elements - Elements to apply names to
 * @returns Map of elements to their original view-transition-name values
 *
 * @internal
 */
function applyViewTransitionNames(
  baseName: Optional<string>,
  elements: Optional<HTMLElement[]>,
): Map<HTMLElement, string> {
  const originalNames = new Map<HTMLElement, string>();

  if (!baseName || !elements || elements.length === 0) {
    return originalNames;
  }

  for (const [index, element] of elements.entries()) {
    const originalValue = element.style.viewTransitionName;
    originalNames.set(element, originalValue);

    const transitionName = elements.length === 1 ? baseName : `${baseName}-${index}`;
    element.style.viewTransitionName = transitionName;
  }

  return originalNames;
}

/**
 * Remove view-transition-name CSS properties and restore original values.
 *
 * @param namedElements - Map of elements to their original view-transition-name values
 *
 * @internal
 */
function removeViewTransitionNames(namedElements: Map<HTMLElement, string>): void {
  for (const [element, originalValue] of namedElements) {
    if (originalValue) {
      element.style.viewTransitionName = originalValue;
    } else {
      element.style.viewTransitionName = "";
    }
  }
}

/**
 * Wraps a callback with View Transitions API if supported.
 * This is a simpler version without named transitions support.
 *
 * @param cb - Function to execute
 * @param respectReducedMotion - Skip transition if prefers-reduced-motion
 *
 * @example
 * ```typescript
 * withViewTransition(() => {
 *   element.remove();
 * });
 * ```
 */
export function withViewTransition(cb: () => void, respectReducedMotion = true): void {
  if (respectReducedMotion && prefersReducedMotion()) {
    cb();
    return;
  }

  if (supportsViewTransitions()) {
    (document as DocumentWithViewTransition).startViewTransition(cb);
  } else {
    cb();
  }
}
