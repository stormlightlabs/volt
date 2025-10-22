/**
 * Shift plugin for CSS keyframe animations
 * Provides reusable animation presets that can be triggered on demand
 */

import { prefersReducedMotion } from "$core/transitions";
import type { Optional } from "$types/helpers";
import type { AnimationPreset, PluginContext, Signal } from "$types/volt";

/**
 * Registry of animation presets
 */
const animationRegistry = new Map<string, AnimationPreset>();
const keyframeRegistry = new Map<string, string>();

let keyframeSheet: Optional<CSSStyleSheet>;
let keyframeCounter = 0;

/**
 * Built-in animation presets with CSS keyframes
 */
const builtinAnimations: Record<string, AnimationPreset> = {
  bounce: {
    keyframes: [
      { offset: 0, transform: "translateY(0)" },
      { offset: 0.25, transform: "translateY(-20px)" },
      { offset: 0.5, transform: "translateY(0)" },
      { offset: 0.75, transform: "translateY(-10px)" },
      { offset: 1, transform: "translateY(0)" },
    ],
    duration: 100,
    iterations: 1,
    timing: "ease",
  },
  shake: {
    keyframes: [
      { offset: 0, transform: "translateX(0)" },
      { offset: 0.1, transform: "translateX(-10px)" },
      { offset: 0.2, transform: "translateX(10px)" },
      { offset: 0.3, transform: "translateX(-10px)" },
      { offset: 0.4, transform: "translateX(10px)" },
      { offset: 0.5, transform: "translateX(-10px)" },
      { offset: 0.6, transform: "translateX(10px)" },
      { offset: 0.7, transform: "translateX(-10px)" },
      { offset: 0.8, transform: "translateX(10px)" },
      { offset: 0.9, transform: "translateX(-10px)" },
      { offset: 1, transform: "translateX(0)" },
    ],
    duration: 500,
    iterations: 1,
    timing: "ease",
  },
  pulse: {
    keyframes: [{ offset: 0, transform: "scale(1)", opacity: "1" }, {
      offset: 0.5,
      transform: "scale(1.05)",
      opacity: "0.9",
    }, { offset: 1, transform: "scale(1)", opacity: "1" }],
    duration: 1000,
    iterations: Number.POSITIVE_INFINITY,
    timing: "ease-in-out",
  },
  spin: {
    keyframes: [{ offset: 0, transform: "rotate(0deg)" }, { offset: 1, transform: "rotate(360deg)" }],
    duration: 1000,
    iterations: Number.POSITIVE_INFINITY,
    timing: "linear",
  },
  flash: {
    keyframes: [{ offset: 0, opacity: "1" }, { offset: 0.25, opacity: "0" }, { offset: 0.5, opacity: "1" }, {
      offset: 0.75,
      opacity: "0",
    }, { offset: 1, opacity: "1" }],
    duration: 1000,
    iterations: 1,
    timing: "linear",
  },
};

function initBuiltinAnimations(): void {
  for (const [name, preset] of Object.entries(builtinAnimations)) {
    animationRegistry.set(name, preset);
  }
}

initBuiltinAnimations();

/**
 * Register a custom animation preset.
 * Allows users to define their own named animations in programmatic mode.
 *
 * @param name - Animation name (used in data-volt-shift="name")
 * @param preset - Animation configuration with keyframes and timing
 *
 * @example
 * ```typescript
 * registerAnimation('wiggle', {
 *   keyframes: [
 *     { offset: 0, transform: 'rotate(0deg)' },
 *     { offset: 0.25, transform: 'rotate(-5deg)' },
 *     { offset: 0.75, transform: 'rotate(5deg)' },
 *     { offset: 1, transform: 'rotate(0deg)' }
 *   ],
 *   duration: 300,
 *   iterations: 2,
 *   timing: 'ease-in-out'
 * });
 * ```
 */
export function registerAnimation(name: string, preset: AnimationPreset): void {
  if (animationRegistry.has(name) && Object.hasOwn(builtinAnimations, name)) {
    console.warn(`[Volt] Overriding built-in animation preset: "${name}"`);
  }
  animationRegistry.set(name, preset);
}

/**
 * Get an animation preset by name.
 * Checks both custom and built-in presets.
 *
 * @param name - Preset name
 * @returns Animation preset or undefined if not found
 */
export function getAnimation(name: string): Optional<AnimationPreset> {
  return animationRegistry.get(name);
}

/**
 * Check if an animation preset exists.
 *
 * @param name - Preset name
 * @returns true if the preset is registered
 */
export function hasAnimation(name: string): boolean {
  return animationRegistry.has(name);
}

/**
 * Unregister a custom animation preset.
 * Built-in presets cannot be unregistered.
 *
 * @param name - Preset name
 * @returns true if the preset was removed, false otherwise
 */
export function unregisterAnimation(name: string): boolean {
  if (Object.hasOwn(builtinAnimations, name)) {
    console.warn(`[Volt] Cannot unregister built-in animation preset: "${name}"`);
    return false;
  }
  return animationRegistry.delete(name);
}

/**
 * Get all registered animation preset names.
 *
 * @returns Array of preset names
 */
export function getRegisteredAnimations(): string[] {
  return [...animationRegistry.keys()];
}

type ParsedShiftValue = { animationName: string; duration?: number; iterations?: number; signalPath?: string };

/**
 * Parse shift plugin value to extract configuration.
 * Supports:
 * - "animationName" - default animation
 * - "animationName.duration" - custom duration
 * - "animationName.duration.iterations" - custom duration and iterations
 * - "signalPath:animationName" - watch signal with animation
 * - "signalPath:animationName.duration.iterations" - watch signal with custom settings
 */
function parseShiftValue(value: string): Optional<ParsedShiftValue> {
  const colonIndex = value.indexOf(":");

  if (colonIndex !== -1) {
    const signalPath = value.slice(0, colonIndex).trim();
    const animationPart = value.slice(colonIndex + 1).trim();
    const parsed = parseAnimationValue(animationPart);

    if (!parsed) {
      return undefined;
    }

    return { ...parsed, signalPath };
  }

  return parseAnimationValue(value);
}

function parseAnimationValue(value: string): Optional<ParsedShiftValue> {
  const parts = value.split(".");
  const animationName = parts[0]?.trim();

  if (!animationName) {
    return undefined;
  }

  const result: ParsedShiftValue = { animationName };

  if (parts.length > 1) {
    const duration = Number.parseInt(parts[1], 10);
    if (!Number.isNaN(duration)) {
      result.duration = duration;
    }
  }

  if (parts.length > 2) {
    const iterations = Number.parseInt(parts[2], 10);
    if (!Number.isNaN(iterations)) {
      result.iterations = iterations;
    }
  }

  return result;
}

function stopAnimation(el: HTMLElement): void {
  el.style.animation = "";
  el.style.animationName = "";
  el.style.animationDuration = "";
  el.style.animationTimingFunction = "";
  el.style.animationIterationCount = "";
  el.style.animationFillMode = "";
  restoreOriginalDisplay(el);
}

function applyAnimation(el: HTMLElement, preset: AnimationPreset, duration?: number, iterations?: number): void {
  if (prefersReducedMotion()) {
    return;
  }

  const effectiveDuration = duration ?? preset.duration;
  const effectiveIterations = iterations ?? preset.iterations;
  const animationName = getOrCreateKeyframes(preset);
  if (!animationName) {
    return;
  }

  ensureInlineBlockForTransforms(el, effectiveIterations === Number.POSITIVE_INFINITY);
  resetCssAnimation(el);

  el.style.animationName = animationName;
  el.style.animationDuration = `${effectiveDuration}ms`;
  el.style.animationTimingFunction = preset.timing;
  el.style.animationIterationCount = effectiveIterations === Number.POSITIVE_INFINITY
    ? "infinite"
    : String(effectiveIterations);
  el.style.animationFillMode = "forwards";

  const runs = Number.parseInt(el.dataset.voltShiftRuns ?? "0", 10) + 1;
  el.dataset.voltShiftRuns = String(runs);

  if (effectiveIterations !== Number.POSITIVE_INFINITY) {
    const totalDuration = effectiveDuration * effectiveIterations;
    setTimeout(() => {
      if (el.style.animationName === animationName) {
        stopAnimation(el);
      }
    }, totalDuration);
  }
}

function resetCssAnimation(el: HTMLElement): void {
  const previousName = el.style.animationName;
  if (!previousName) {
    return;
  }
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "";
  el.style.animationName = "";
}

function ensureKeyframeSheet(): Optional<CSSStyleSheet> {
  if (keyframeSheet) {
    return keyframeSheet;
  }

  if (typeof document === "undefined" || !document.head) {
    return undefined;
  }

  const styleEl = document.createElement("style");
  styleEl.dataset.voltShift = "true";
  document.head.append(styleEl);
  keyframeSheet = styleEl.sheet ?? undefined;
  return keyframeSheet;
}

function toCssProperty(property: string): string {
  return property.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function getOrCreateKeyframes(preset: AnimationPreset): Optional<string> {
  const key = JSON.stringify(preset.keyframes) + preset.timing;
  if (keyframeRegistry.has(key)) {
    return keyframeRegistry.get(key);
  }

  const sheet = ensureKeyframeSheet();
  if (!sheet) {
    return undefined;
  }

  const animationName = `volt-shift-${keyframeCounter += 1}`;
  keyframeRegistry.set(key, animationName);

  const frames = preset.keyframes.map((frame, index) => {
    const offset = frame.offset ?? (preset.keyframes.length > 1 ? index / (preset.keyframes.length - 1) : 0);
    const percent = Math.round(offset * 10_000) / 100;
    const declarations = Object.entries(frame).filter(([prop]) => prop !== "offset").map(([prop, value]) =>
      `${toCssProperty(prop)}: ${value};`
    ).join(" ");
    return `${percent}% { ${declarations} }`;
  }).join(" ");

  sheet.insertRule(`@keyframes ${animationName} { ${frames} }`, sheet.cssRules.length);
  return animationName;
}

function ensureInlineBlockForTransforms(el: HTMLElement, isInf: boolean): void {
  if (el.dataset.voltShiftDisplayManaged) {
    return;
  }

  if (typeof getComputedStyle !== "function") {
    return;
  }

  if (!el.isConnected) {
    return;
  }

  void el.offsetHeight;

  const computedDisplay = getComputedStyle(el).display;
  if (computedDisplay !== "inline") {
    return;
  }

  el.dataset.voltShiftDisplayManaged = isInf ? "infinite" : "managed";
  el.dataset.voltShiftOriginalDisplay = el.style.display ?? "";

  if (!el.dataset.voltShiftOriginalTransformOrigin) {
    el.dataset.voltShiftOriginalTransformOrigin = el.style.transformOrigin ?? "";
  }

  el.style.display = "inline-block";
  if (!el.style.transformOrigin) {
    el.style.transformOrigin = "center center";
  }
}

function restoreOriginalDisplay(element: HTMLElement): void {
  const state = element.dataset.voltShiftDisplayManaged;
  if (!state || state === "infinite") {
    return;
  }

  const original = element.dataset.voltShiftOriginalDisplay ?? "";
  element.style.display = original;
  const originalOrigin = element.dataset.voltShiftOriginalTransformOrigin ?? "";
  element.style.transformOrigin = originalOrigin;
  delete element.dataset.voltShiftDisplayManaged;
  delete element.dataset.voltShiftOriginalDisplay;
  delete element.dataset.voltShiftOriginalTransformOrigin;
}

/**
 * Shift plugin handler.
 * Provides CSS keyframe animations for elements.
 *
 * Syntax:
 * - data-volt-shift="animationName" - Run animation with default settings
 * - data-volt-shift="animationName.duration.iterations" - Custom duration and iterations
 * - data-volt-shift="signalPath:animationName" - Watch signal to trigger animation
 *
 * @example
 * ```html
 * <!-- One-time animation on mount -->
 * <button data-volt-shift="bounce">Click Me</button>
 *
 * <!-- Continuous pulse animation -->
 * <div data-volt-shift="pulse">Loading...</div>
 *
 * <!-- Trigger animation based on signal -->
 * <div data-volt-shift="error:shake">Error occurred!</div>
 *
 * <!-- Custom duration and iterations -->
 * <div data-volt-shift="bounce.1000.3">Triple bounce!</div>
 * ```
 */
export function shiftPlugin(ctx: PluginContext, value: string): void {
  const el = ctx.element as HTMLElement;

  const parsed = parseShiftValue(value);
  if (!parsed) {
    console.error(`[Volt] Invalid shift value: "${value}"`);
    return;
  }

  const preset = getAnimation(parsed.animationName);
  if (!preset) {
    console.error(`[Volt] Unknown animation preset: "${parsed.animationName}"`);
    return;
  }

  if (parsed.signalPath) {
    const signal = ctx.findSignal(parsed.signalPath) as Optional<Signal<unknown>>;
    if (!signal) {
      console.error(`[Volt] Signal "${parsed.signalPath}" not found for shift binding`);
      return;
    }

    const effectiveIterations = parsed.iterations ?? preset.iterations;
    const isInfinite = effectiveIterations === Number.POSITIVE_INFINITY;
    let previousValue = signal.get();

    const unsubscribe = signal.subscribe((value) => {
      if (value !== previousValue) {
        if (value) {
          applyAnimation(el, preset, parsed.duration, parsed.iterations);
        } else if (isInfinite && el.style.animationName) {
          stopAnimation(el);
        }
      }
      previousValue = value;
    });

    ctx.addCleanup(unsubscribe);

    if (signal.get()) {
      ctx.lifecycle.onMount(() => {
        requestAnimationFrame(() => {
          applyAnimation(el, preset, parsed.duration, parsed.iterations);
        });
      });
    }
  } else {
    ctx.lifecycle.onMount(() => {
      requestAnimationFrame(() => {
        applyAnimation(el, preset, parsed.duration, parsed.iterations);
      });
    });
  }
}
