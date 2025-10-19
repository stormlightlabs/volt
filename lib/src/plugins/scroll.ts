/**
 * Scroll plugin for managing scroll behavior
 * Supports position restoration, scroll-to, scroll spy, and smooth scrolling
 */

import type { PluginContext, Signal } from "$types/volt";

/**
 * Scroll plugin handler to manage various scroll-related behaviors.
 *
 * Syntax: data-volt-scroll="mode:signalPath"
 * Modes:
 *   - restore:signalPath - Save/restore scroll position
 *   - scrollTo:signalPath - Scroll to element when signal changes
 *   - spy:signalPath - Update signal when element is visible
 *   - smooth:signalPath - Enable smooth scrolling behavior
 */
export function scrollPlugin(ctx: PluginContext, value: string): void {
  const parts = value.split(":");
  if (parts.length !== 2) {
    console.error(`Invalid scroll binding: "${value}". Expected format: "mode:signalPath"`);
    return;
  }

  const [mode, signalPath] = parts.map((p) => p.trim());

  switch (mode) {
    case "restore": {
      handleScrollRestore(ctx, signalPath);
      break;
    }
    case "scrollTo": {
      handleScrollTo(ctx, signalPath);
      break;
    }
    case "spy": {
      handleScrollSpy(ctx, signalPath);
      break;
    }
    case "smooth": {
      handleSmoothScroll(ctx, signalPath);
      break;
    }
    default: {
      console.error(`Unknown scroll mode: "${mode}"`);
    }
  }
}

/**
 * Saves current scroll position to signal on scroll events; Restores scroll position from signal on mount.
 */
function handleScrollRestore(ctx: PluginContext, signalPath: string): void {
  const signal = ctx.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for scroll restore`);
    return;
  }

  const element = ctx.element as HTMLElement;
  const savedPosition = signal.get();
  if (typeof savedPosition === "number") {
    element.scrollTop = savedPosition;
  }

  const savePosition = () => {
    (signal as Signal<number>).set(element.scrollTop);
  };

  element.addEventListener("scroll", savePosition, { passive: true });

  ctx.addCleanup(() => {
    element.removeEventListener("scroll", savePosition);
  });
}

/**
 * Scroll to element when signal value matches element's ID or selector.
 * Listens for changes to the target signal to determine position
 */
function handleScrollTo(ctx: PluginContext, signalPath: string): void {
  const signal = ctx.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for scrollTo`);
    return;
  }

  const element = ctx.element as HTMLElement;
  const elementId = element.id;

  const checkAndScroll = (target: unknown) => {
    if (target === elementId || target === `#${elementId}`) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  checkAndScroll(signal.get());

  const unsubscribe = signal.subscribe(checkAndScroll);
  ctx.addCleanup(unsubscribe);
}

/**
 * Update signal when element enters or exits viewport.
 * Uses {@link IntersectionObserver} to track visibility.
 */
function handleScrollSpy(ctx: PluginContext, signalPath: string): void {
  const signal = ctx.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for scroll spy`);
    return;
  }

  const element = ctx.element as HTMLElement;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === element) {
        (signal as Signal<boolean>).set(entry.isIntersecting);
      }
    }
  }, { threshold: 0.1 });

  observer.observe(element);

  ctx.addCleanup(() => {
    observer.disconnect();
  });
}

/**
 * Enable smooth scrolling behavior and apply based on signal value.
 */
function handleSmoothScroll(ctx: PluginContext, signalPath: string): void {
  const signal = ctx.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for smooth scroll`);
    return;
  }

  const element = ctx.element as HTMLElement;

  const applyBehavior = (value: unknown) => {
    if (value === true || value === "smooth") {
      element.style.scrollBehavior = "smooth";
    } else if (value === false || value === "auto") {
      element.style.scrollBehavior = "auto";
    }
  };

  applyBehavior(signal.get());

  const unsubscribe = signal.subscribe(applyBehavior);

  ctx.addCleanup(() => {
    unsubscribe();
    element.style.scrollBehavior = "";
  });
}
