/**
 * Scroll plugin for managing scroll behavior
 * Supports position restoration, scroll-to, scroll spy, and smooth scrolling
 */

import type { PluginContext, Signal } from "../types/volt";

/**
 * Scroll plugin handler.
 * Manages various scroll-related behaviors.
 *
 * Syntax: data-x-scroll="mode:signalPath"
 * Modes:
 *   - restore:signalPath - Save/restore scroll position
 *   - scrollTo:signalPath - Scroll to element when signal changes
 *   - spy:signalPath - Update signal when element is visible
 *   - smooth:signalPath - Enable smooth scrolling behavior
 */
export function scrollPlugin(context: PluginContext, value: string): void {
  const parts = value.split(":");
  if (parts.length !== 2) {
    console.error(`Invalid scroll binding: "${value}". Expected format: "mode:signalPath"`);
    return;
  }

  const [mode, signalPath] = parts.map((p) => p.trim());

  switch (mode) {
    case "restore": {
      handleScrollRestore(context, signalPath);
      break;
    }
    case "scrollTo": {
      handleScrollTo(context, signalPath);
      break;
    }
    case "spy": {
      handleScrollSpy(context, signalPath);
      break;
    }
    case "smooth": {
      handleSmoothScroll(context, signalPath);
      break;
    }
    default: {
      console.error(`Unknown scroll mode: "${mode}"`);
    }
  }
}

/**
 * Save and restore scroll position.
 * Saves current scroll position to signal on scroll events.
 * Restores scroll position from signal on mount.
 */
function handleScrollRestore(context: PluginContext, signalPath: string): void {
  const signal = context.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for scroll restore`);
    return;
  }

  const element = context.element as HTMLElement;
  const savedPosition = signal.get();
  if (typeof savedPosition === "number") {
    element.scrollTop = savedPosition;
  }

  const savePosition = () => {
    (signal as Signal<number>).set(element.scrollTop);
  };

  element.addEventListener("scroll", savePosition, { passive: true });

  context.addCleanup(() => {
    element.removeEventListener("scroll", savePosition);
  });
}

/**
 * Scroll to element when signal value matches element's ID or selector.
 * Listens for changes to the target signal and scrolls to this element.
 */
function handleScrollTo(context: PluginContext, signalPath: string): void {
  const signal = context.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for scrollTo`);
    return;
  }

  const element = context.element as HTMLElement;
  const elementId = element.id;

  const checkAndScroll = (target: unknown) => {
    if (target === elementId || target === `#${elementId}`) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  checkAndScroll(signal.get());

  const unsubscribe = signal.subscribe(checkAndScroll);
  context.addCleanup(unsubscribe);
}

/**
 * Update signal when element enters or exits viewport.
 * Uses Intersection Observer to track visibility.
 */
function handleScrollSpy(context: PluginContext, signalPath: string): void {
  const signal = context.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for scroll spy`);
    return;
  }

  const element = context.element as HTMLElement;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === element) {
        (signal as Signal<boolean>).set(entry.isIntersecting);
      }
    }
  }, { threshold: 0.1 });

  observer.observe(element);

  context.addCleanup(() => {
    observer.disconnect();
  });
}

/**
 * Enable smooth scrolling behavior.
 * Applies smooth scroll behavior based on signal value.
 */
function handleSmoothScroll(context: PluginContext, signalPath: string): void {
  const signal = context.findSignal(signalPath);
  if (!signal) {
    console.error(`Signal "${signalPath}" not found for smooth scroll`);
    return;
  }

  const element = context.element as HTMLElement;

  const applyBehavior = (value: unknown) => {
    if (value === true || value === "smooth") {
      element.style.scrollBehavior = "smooth";
    } else if (value === false || value === "auto") {
      element.style.scrollBehavior = "auto";
    }
  };

  applyBehavior(signal.get());

  const unsubscribe = signal.subscribe(applyBehavior);

  context.addCleanup(() => {
    unsubscribe();
    element.style.scrollBehavior = "";
  });
}
