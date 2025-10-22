/**
 * Navigate plugin for client-side navigation with History API
 *
 * Intercepts link clicks and form submissions. Integrates with the History API and View Transition API for smooth page transitions.
 */

import { registerDirective } from "$core/binder";
import { hasModifier } from "$core/modifiers";
import { startViewTransition } from "$core/view-transitions";
import type { Optional } from "$types/helpers";
import type { BindingContext, Modifier } from "$types/volt";

type NavigationState = { scrollPosition?: { x: number; y: number }; focusSelector?: string; timestamp: number };

type NavigationOpts = { replace?: boolean; transition?: boolean; transitionName?: string };

const scrollPositions = new Map<string, { x: number; y: number }>();
const focusSelectors = new Map<string, string>();

/**
 * Navigate directive handler for client-side navigation
 *
 * Syntax: data-volt-navigate[.modifiers]="url" or data-volt-navigate[.modifiers] (uses href)
 *
 * Modifiers:
 *   - .replace - Use replaceState instead of pushState
 *   - .prefetch - Prefetch resources on hover/idle
 *   - .notransition - Disable view transitions
 *
 * @example
 * ```html
 * <a href="/about" data-volt-navigate>About</a>
 * <a href="/home" data-volt-navigate-replace>Home</a>
 * <a href="/blog" data-volt-navigate-prefetch>Blog</a>
 * <a href="/settings" data-volt-navigate-notransition>Settings</a>
 * ```
 */
export function bindNavigate(ctx: BindingContext, value: string, modifiers: Modifier[] = []): void {
  const element = ctx.element;

  if (element instanceof HTMLAnchorElement) {
    handleLinkNavigation(ctx, value, modifiers);
  } else if (element instanceof HTMLFormElement) {
    handleFormNavigation(ctx, value, modifiers);
  } else {
    console.warn("data-volt-navigate only works on <a> and <form> elements");
  }
}

function handleLinkNavigation(ctx: BindingContext, value: string, modifiers: Modifier[]): void {
  const link = ctx.element as HTMLAnchorElement;
  const targetUrl = value || link.getAttribute("href");

  if (!targetUrl) {
    console.warn("data-volt-navigate: no URL specified and no href found");
    return;
  }

  if (hasModifier(modifiers, "prefetch")) {
    const viewportPrefetch = hasModifier(modifiers, "viewport");
    setupPrefetch(link, targetUrl, { viewport: viewportPrefetch });
  }

  const clickHandler = async (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
      return;
    }

    if (isExternalLink(targetUrl)) {
      return;
    }

    event.preventDefault();

    const useReplace = hasModifier(modifiers, "replace");
    const useTransition = !hasModifier(modifiers, "notransition");

    await navigateTo(targetUrl, { replace: useReplace, transition: useTransition, transitionName: "page-transition" });
  };

  link.addEventListener("click", clickHandler);
  ctx.cleanups.push(() => link.removeEventListener("click", clickHandler));
}

function handleFormNavigation(ctx: BindingContext, value: string, modifiers: Modifier[]): void {
  const form = ctx.element as HTMLFormElement;
  const targetUrl = value || form.getAttribute("action") || globalThis.location.pathname;

  const submitHandler = async (event: SubmitEvent) => {
    event.preventDefault();

    const formData = new FormData(form);
    const method = form.method.toLowerCase();
    const useReplace = hasModifier(modifiers, "replace");
    const useTransition = !hasModifier(modifiers, "notransition");

    if (method === "get") {
      // TODO: serialize FormData
      const params = new URLSearchParams(formData as any);
      const url = `${targetUrl}?${params.toString()}`;
      await navigateTo(url, { replace: useReplace, transition: useTransition, transitionName: "page-transition" });
    } else {
      console.warn("data-volt-navigate: POST/PUT/PATCH forms should use data-volt-post/put/patch");
    }
  };

  form.addEventListener("submit", submitHandler);
  ctx.cleanups.push(() => form.removeEventListener("submit", submitHandler));
}

async function navigateTo(url: string, options: NavigationOpts = {}): Promise<void> {
  const { replace = false, transition = true, transitionName = "page-transition" } = options;
  const currentKey = `${globalThis.location.pathname}${globalThis.location.search}`;
  scrollPositions.set(currentKey, { x: window.scrollX, y: window.scrollY });

  const activeElement = document.activeElement;
  const focusSelector = activeElement && activeElement !== document.body
    ? getElementSelector(activeElement)
    : undefined;
  if (focusSelector) {
    focusSelectors.set(currentKey, focusSelector);
  }

  const state: NavigationState = {
    scrollPosition: { x: window.scrollX, y: window.scrollY },
    focusSelector,
    timestamp: Date.now(),
  };

  const performNavigation = async () => {
    if (replace) {
      globalThis.history.replaceState(state, "", url);
    } else {
      globalThis.history.pushState(state, "", url);
    }

    globalThis.dispatchEvent(
      new CustomEvent("volt:navigate", { detail: { url, replace }, bubbles: true, cancelable: false }),
    );

    window.scrollTo(0, 0);

    resetFocusAfterNavigation();
  };

  if (transition && typeof transitionName === "string") {
    await startViewTransition(performNavigation, { name: transitionName });
  } else {
    await performNavigation();
  }
}

/**
 * Generate a unique selector for an element (for focus restoration)
 * Tries id, then name, then data attributes, then position-based selector
 */
function getElementSelector(element: Element): Optional<string> {
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.hasAttribute("name")) {
    const name = element.getAttribute("name");
    const tag = element.tagName.toLowerCase();
    return `${tag}[name="${name}"]`;
  }

  for (const attr of element.attributes) {
    if (attr.name.startsWith("data-volt-")) {
      return `[${attr.name}="${attr.value}"]`;
    }
  }

  if (element.hasAttribute("aria-label")) {
    const label = element.getAttribute("aria-label");
    return `[aria-label="${label}"]`;
  }

  const parent = element.parentElement;
  if (!parent) return undefined;

  const siblings = [...parent.children];
  const index = siblings.indexOf(element);
  const tag = element.tagName.toLowerCase();

  return `${tag}:nth-child(${index + 1})`;
}

/**
 * Reset focus to a sensible location after navigation
 * Tries to focus main content area or first focusable element
 */
function resetFocusAfterNavigation(): void {
  const main = document.querySelector("main, [role='main'], #main-content");
  if (main instanceof HTMLElement && main.tabIndex < 0) {
    main.tabIndex = -1;
  }

  if (main instanceof HTMLElement) {
    main.focus({ preventScroll: true });
    return;
  }

  const firstHeading = document.querySelector("h1");
  if (firstHeading instanceof HTMLElement) {
    if (firstHeading.tabIndex < 0) {
      firstHeading.tabIndex = -1;
    }
    firstHeading.focus({ preventScroll: true });
    return;
  }

  document.body.focus({ preventScroll: true });
}

/**
 * Restore focus to the previously focused element (for back/forward navigation)
 */
function restoreFocus(selector: string): boolean {
  try {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      element.focus({ preventScroll: true });
      return true;
    }
  } catch (error) {
    console.warn(`Could not restore focus to selector: ${selector}`, error);
  }
  return false;
}

function isExternalLink(url: string): boolean {
  try {
    const target = new URL(url, globalThis.location.origin);
    return target.origin !== globalThis.location.origin;
  } catch {
    return false;
  }
}

/**
 * Setup resource prefetching for a link
 *
 * By default, prefetches on hover/focus (interaction-based).
 * With viewport option, prefetches when element enters viewport (IntersectionObserver).
 */
function setupPrefetch(element: HTMLElement, url: string, opts: { viewport?: boolean } = {}): void {
  const { viewport = false } = opts;
  let prefetched = false;

  const prefetch = () => {
    if (prefetched) return;
    prefetched = true;

    fetch(url, { method: "GET", priority: "low", credentials: "same-origin" } as RequestInit).catch(() => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      document.head.append(link);
    });
  };

  if (viewport) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          prefetch();
          observer.disconnect();
        }
      }
    }, { rootMargin: "50px" });

    observer.observe(element);
  } else {
    element.addEventListener("mouseenter", prefetch, { once: true, passive: true });
    element.addEventListener("focus", prefetch, { once: true, passive: true });
  }
}

/**
 * Initialize popstate listener for back/forward navigation
 * Should be called once on app initialization
 */
export function initNavigationListener(): () => void {
  const handlePopState = (event: PopStateEvent) => {
    const state = event.state as NavigationState | null;

    const key = `${globalThis.location.pathname}${globalThis.location.search}`;
    const savedPosition = scrollPositions.get(key);
    const savedFocus = focusSelectors.get(key);

    if (savedPosition) {
      window.scrollTo(savedPosition.x, savedPosition.y);
    } else if (state?.scrollPosition) {
      window.scrollTo(state.scrollPosition.x, state.scrollPosition.y);
    }

    if (savedFocus) {
      restoreFocus(savedFocus);
    } else if (state?.focusSelector) {
      restoreFocus(state.focusSelector);
    } else {
      resetFocusAfterNavigation();
    }

    globalThis.dispatchEvent(new CustomEvent("volt:popstate", { detail: { state }, bubbles: true, cancelable: false }));
  };

  globalThis.addEventListener("popstate", handlePopState);

  return () => {
    globalThis.removeEventListener("popstate", handlePopState);
  };
}

/**
 * Programmatic navigation helper
 *
 * @param url - URL to navigate to
 * @param options - Navigation options
 *
 * @example
 * ```typescript
 * import { navigate } from 'voltx.js';
 *
 * navigate('/dashboard', { replace: true });
 * ```
 */
export function navigate(url: string, options?: NavigationOpts): Promise<void> {
  return navigateTo(url, options);
}

/**
 * Go back in history
 */
export function goBack(): void {
  globalThis.history.back();
}

/**
 * Go forward in history
 */
export function goForward(): void {
  globalThis.history.forward();
}

/**
 * Redirect to a URL (alias for navigate with replace: true)
 */
export function redirect(url: string): Promise<void> {
  return navigateTo(url, { replace: true });
}

registerDirective("navigate", bindNavigate);
