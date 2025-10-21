/**
 * Surge plugin for enter/leave transitions
 * Provides smooth animations when elements appear or disappear
 */

import { sleep } from "$core/shared";
import { applyOverrides, getEasing, parseTransitionValue, prefersReducedMotion } from "$core/transitions";
import type { Optional } from "$types/helpers";
import type { PluginContext, Signal, TransitionPhase } from "$types/volt";

type SurgeConfig = {
  enterPreset?: TransitionPhase;
  leavePreset?: TransitionPhase;
  signalPath?: string;
  useViewTransitions: boolean;
};

function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

function withViewTransition(callback: () => void): void {
  if (supportsViewTransitions() && !prefersReducedMotion()) {
    (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(callback);
  } else {
    callback();
  }
}

function applyStyles(element: HTMLElement, styles: Record<string, string | number>): void {
  for (const [property, value] of Object.entries(styles)) {
    const cssProperty = property.replaceAll(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    element.style.setProperty(cssProperty, String(value));
  }
}

function applyClasses(el: HTMLElement, classes: string[]): void {
  for (const cls of classes) {
    el.classList.add(cls);
  }
}

function rmClasses(el: HTMLElement, classes: string[]): void {
  for (const cls of classes) {
    el.classList.remove(cls);
  }
}

async function execEnter(element: HTMLElement, phase: TransitionPhase, useViewTransitions: boolean): Promise<void> {
  const duration = phase.duration ?? 300;
  const delay = phase.delay ?? 0;
  const easing = getEasing(phase.easing ?? "ease");

  if (prefersReducedMotion()) {
    if (phase.to) {
      applyStyles(element, phase.to);
    }
    if (phase.classes) {
      applyClasses(element, phase.classes);
    }
    return;
  }

  if (phase.from) {
    applyStyles(element, phase.from);
  }

  if (phase.classes) {
    applyClasses(element, phase.classes);
  }

  void element.offsetHeight;

  element.style.transition = `all ${duration}ms ${easing} ${delay}ms`;

  if (delay > 0) {
    await sleep(delay);
  }

  const transitionPromise = new Promise<void>((resolve) => {
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === element) {
        element.removeEventListener("transitionend", handleTransitionEnd);
        resolve();
      }
    };

    element.addEventListener("transitionend", handleTransitionEnd);

    setTimeout(() => {
      element.removeEventListener("transitionend", handleTransitionEnd);
      resolve();
    }, duration + delay + 50);
  });

  if (useViewTransitions) {
    withViewTransition(() => {
      if (phase.to) {
        applyStyles(element, phase.to);
      }
    });
  } else {
    if (phase.to) {
      applyStyles(element, phase.to);
    }
  }

  await transitionPromise;

  element.style.transition = "";

  if (phase.classes) {
    rmClasses(element, phase.classes);
  }
}

async function execLeave(element: HTMLElement, phase: TransitionPhase, useViewTransitions: boolean): Promise<void> {
  const duration = phase.duration ?? 300;
  const delay = phase.delay ?? 0;
  const easing = getEasing(phase.easing ?? "ease");

  if (prefersReducedMotion()) {
    if (phase.to) {
      applyStyles(element, phase.to);
    }
    if (phase.classes) {
      applyClasses(element, phase.classes);
    }
    return;
  }

  if (phase.from) {
    applyStyles(element, phase.from);
  }

  if (phase.classes) {
    applyClasses(element, phase.classes);
  }

  void element.offsetHeight;

  element.style.transition = `all ${duration}ms ${easing} ${delay}ms`;

  if (delay > 0) {
    await sleep(delay);
  }

  const transitionPromise = new Promise<void>((resolve) => {
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === element) {
        element.removeEventListener("transitionend", handleTransitionEnd);
        resolve();
      }
    };

    element.addEventListener("transitionend", handleTransitionEnd);

    setTimeout(() => {
      element.removeEventListener("transitionend", handleTransitionEnd);
      resolve();
    }, duration + delay + 50);
  });

  if (useViewTransitions) {
    withViewTransition(() => {
      if (phase.to) {
        applyStyles(element, phase.to);
      }
    });
  } else {
    if (phase.to) {
      applyStyles(element, phase.to);
    }
  }

  await transitionPromise;

  element.style.transition = "";

  if (phase.classes) {
    rmClasses(element, phase.classes);
  }
}

/**
 * Parse surge plugin value to extract configuration
 * Supports:
 * - "presetName" - default preset
 * - "signalPath:presetName" - watch signal with preset
 * - "signalPath" - watch signal with default fade
 */
function parseSurgeValue(value: string): Optional<SurgeConfig> {
  const parts = value.split(":");

  if (parts.length === 2) {
    const [signalPath, presetValue] = parts;
    const parsed = parseTransitionValue(presetValue.trim());

    if (!parsed) {
      return undefined;
    }

    return {
      enterPreset: parsed.preset.enter,
      leavePreset: parsed.preset.leave,
      signalPath: signalPath.trim(),
      useViewTransitions: true,
    };
  }

  const parsed = parseTransitionValue(value.trim());
  if (!parsed) {
    return undefined;
  }

  return { enterPreset: parsed.preset.enter, leavePreset: parsed.preset.leave, useViewTransitions: true };
}

function parsePhaseValue(value: string, phase: "enter" | "leave"): Optional<TransitionPhase> {
  const parsed = parseTransitionValue(value.trim());
  if (!parsed) {
    return undefined;
  }
  const presetPhase = phase === "enter" ? parsed.preset.enter : parsed.preset.leave;
  return applyOverrides(presetPhase, parsed.duration, parsed.delay);
}

/**
 * Surge plugin handler.
 * Provides enter/leave transitions for elements.
 *
 * Syntax:
 * - data-volt-surge="presetName" - Default transition preset
 * - data-volt-surge="signalPath:presetName" - Watch signal for transitions
 * - data-volt-surge:enter="presetName" - Specific enter transition
 * - data-volt-surge:leave="presetName" - Specific leave transition
 *
 * @example
 * ```html
 * <!-- Explicit signal watching -->
 * <div data-volt-surge="show:fade">Content</div>
 *
 * <!-- Granular control -->
 * <div
 *   data-volt-surge:enter="slide-down.500"
 *   data-volt-surge:leave="fade.300">
 *   Content
 * </div>
 * ```
 */
export function surgePlugin(ctx: PluginContext, value: string): void {
  const el = ctx.element as HTMLElement;

  if (value.includes(":")) {
    const [phase, presetValue] = value.split(":", 2);

    if (phase === "enter") {
      const enterPhase = parsePhaseValue(presetValue, "enter");
      if (!enterPhase) {
        console.error(`[Volt] Invalid surge enter value: "${value}"`);
        return;
      }

      (el as HTMLElement & { _voltSurgeEnter?: TransitionPhase })._voltSurgeEnter = enterPhase;
      return;
    }

    if (phase === "leave") {
      const leavePhase = parsePhaseValue(presetValue, "leave");
      if (!leavePhase) {
        console.error(`[Volt] Invalid surge leave value: "${value}"`);
        return;
      }

      (el as HTMLElement & { _voltSurgeLeave?: TransitionPhase })._voltSurgeLeave = leavePhase;
      return;
    }
  }

  const config = parseSurgeValue(value);
  if (!config) {
    console.error(`[Volt] Invalid surge value: "${value}"`);
    return;
  }

  if (!config.signalPath) {
    (el as HTMLElement & { _voltSurgeConfig?: SurgeConfig })._voltSurgeConfig = config;
    return;
  }

  const signal = ctx.findSignal(config.signalPath) as Optional<Signal<unknown>>;
  if (!signal) {
    console.error(`[Volt] Signal "${config.signalPath}" not found for surge binding`);
    return;
  }

  let isVisible = Boolean(signal.get());
  let isTransitioning = false;

  if (!isVisible) {
    el.style.display = "none";
  }

  const handleTransition = async (shouldShow: boolean) => {
    if (isTransitioning || shouldShow === isVisible) {
      return;
    }

    isTransitioning = true;

    if (shouldShow && config.enterPreset) {
      el.style.display = "";
      await execEnter(el, config.enterPreset, config.useViewTransitions);
      isVisible = true;
    } else if (!shouldShow && config.leavePreset) {
      await execLeave(el, config.leavePreset, config.useViewTransitions);
      el.style.display = "none";
      isVisible = false;
    }

    isTransitioning = false;
  };

  const unsubscribe = signal.subscribe((value) => {
    const shouldShow = Boolean(value);
    void handleTransition(shouldShow);
  });

  ctx.addCleanup(unsubscribe);
}

/**
 * @internal
 */
export async function executeSurgeEnter(element: HTMLElement): Promise<void> {
  const config = (element as HTMLElement & { _voltSurgeConfig?: SurgeConfig })._voltSurgeConfig;
  const customEnter = (element as HTMLElement & { _voltSurgeEnter?: TransitionPhase })._voltSurgeEnter;

  const enterPhase = customEnter ?? config?.enterPreset;
  if (!enterPhase) {
    return;
  }

  const useViewTransitions = config?.useViewTransitions ?? true;
  await execEnter(element, enterPhase, useViewTransitions);
}

/**
 * @internal
 */
export async function executeSurgeLeave(element: HTMLElement): Promise<void> {
  const config = (element as HTMLElement & { _voltSurgeConfig?: SurgeConfig })._voltSurgeConfig;
  const customLeave = (element as HTMLElement & { _voltSurgeLeave?: TransitionPhase })._voltSurgeLeave;

  const leavePhase = customLeave ?? config?.leavePreset;
  if (!leavePhase) {
    return;
  }

  const useViewTransitions = config?.useViewTransitions ?? true;
  await execLeave(element, leavePhase, useViewTransitions);
}

/**
 * @internal
 */
export function hasSurge(element: HTMLElement): boolean {
  const config = (element as HTMLElement & { _voltSurgeConfig?: SurgeConfig })._voltSurgeConfig;
  const customEnter = (element as HTMLElement & { _voltSurgeEnter?: TransitionPhase })._voltSurgeEnter;
  const customLeave = (element as HTMLElement & { _voltSurgeLeave?: TransitionPhase })._voltSurgeLeave;

  return Boolean(config || customEnter || customLeave);
}
