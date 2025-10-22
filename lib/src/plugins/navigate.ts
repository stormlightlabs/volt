/**
 * Navigate plugin for client-side navigation with History API
 *
 * Provides seamless client-side navigation by intercepting link clicks and form submissions,
 * integrating with the History API and View Transition API for smooth page transitions.
 */

import { registerDirective } from "$core/binder";
import { hasModifier, parseModifiers } from "$core/modifiers";
import { startViewTransition } from "$core/view-transitions";
import type { BindingContext, Modifier, PluginContext } from "$types/volt";

type NavigationState = { scrollPosition?: { x: number; y: number }; timestamp: number };

type NavigationOpts = { replace?: boolean; transition?: boolean; transitionName?: string };

const scrollPositions = new Map<string, { x: number; y: number }>();

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

/**
 * Plugin-compatible wrapper for navigate directive
 * @deprecated Use bindNavigate directly or register as a directive
 */
export function navigatePlugin(ctx: PluginContext, value: string): void {
  const { baseName, modifiers } = parseModifiers(value || "");
  const bindingCtx: BindingContext = { element: ctx.element, scope: ctx.scope, cleanups: [] };

  bindNavigate(bindingCtx, baseName, modifiers);

  for (const cleanup of bindingCtx.cleanups) {
    ctx.addCleanup(cleanup);
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
    setupPrefetch(link, targetUrl);
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

  const state: NavigationState = { scrollPosition: { x: window.scrollX, y: window.scrollY }, timestamp: Date.now() };

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
  };

  if (transition && typeof transitionName === "string") {
    await startViewTransition(performNavigation, { name: transitionName });
  } else {
    await performNavigation();
  }
}

function isExternalLink(url: string): boolean {
  try {
    const target = new URL(url, globalThis.location.origin);
    return target.origin !== globalThis.location.origin;
  } catch {
    return false;
  }
}

function setupPrefetch(element: HTMLElement, url: string): void {
  let prefetched = false;

  const prefetch = () => {
    if (prefetched) return;
    prefetched = true;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.append(link);
  };

  element.addEventListener("mouseenter", prefetch, { once: true, passive: true });
  element.addEventListener("focus", prefetch, { once: true, passive: true });
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

    if (savedPosition) {
      window.scrollTo(savedPosition.x, savedPosition.y);
    } else if (state?.scrollPosition) {
      window.scrollTo(state.scrollPosition.x, state.scrollPosition.y);
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
