/**
 * Transition preset system for surge plugin
 * Provides built-in transition presets and custom preset registration
 */

import type { Optional } from "$types/helpers";
import type { ParsedTransition, TransitionPhase, TransitionPreset } from "$types/volt";

/**
 * Registry of transition presets
 */
const transitionRegistry = new Map<string, TransitionPreset>();

/**
 * Built-in transition presets
 */
const builtinPresets: Record<string, TransitionPreset> = {
  fade: {
    enter: { from: { opacity: 0 }, to: { opacity: 1 }, duration: 300, easing: "ease" },
    leave: { from: { opacity: 1 }, to: { opacity: 0 }, duration: 300, easing: "ease" },
  },
  "slide-up": {
    enter: {
      from: { opacity: 0, transform: "translateY(20px)" },
      to: { opacity: 1, transform: "translateY(0)" },
      duration: 300,
      easing: "ease-out",
    },
    leave: {
      from: { opacity: 1, transform: "translateY(0)" },
      to: { opacity: 0, transform: "translateY(-20px)" },
      duration: 300,
      easing: "ease-in",
    },
  },
  "slide-down": {
    enter: {
      from: { opacity: 0, transform: "translateY(-20px)" },
      to: { opacity: 1, transform: "translateY(0)" },
      duration: 300,
      easing: "ease-out",
    },
    leave: {
      from: { opacity: 1, transform: "translateY(0)" },
      to: { opacity: 0, transform: "translateY(20px)" },
      duration: 300,
      easing: "ease-in",
    },
  },
  "slide-left": {
    enter: {
      from: { opacity: 0, transform: "translateX(20px)" },
      to: { opacity: 1, transform: "translateX(0)" },
      duration: 300,
      easing: "ease-out",
    },
    leave: {
      from: { opacity: 1, transform: "translateX(0)" },
      to: { opacity: 0, transform: "translateX(-20px)" },
      duration: 300,
      easing: "ease-in",
    },
  },
  "slide-right": {
    enter: {
      from: { opacity: 0, transform: "translateX(-20px)" },
      to: { opacity: 1, transform: "translateX(0)" },
      duration: 300,
      easing: "ease-out",
    },
    leave: {
      from: { opacity: 1, transform: "translateX(0)" },
      to: { opacity: 0, transform: "translateX(20px)" },
      duration: 300,
      easing: "ease-in",
    },
  },
  scale: {
    enter: {
      from: { opacity: 0, transform: "scale(0.95)" },
      to: { opacity: 1, transform: "scale(1)" },
      duration: 300,
      easing: "ease-out",
    },
    leave: {
      from: { opacity: 1, transform: "scale(1)" },
      to: { opacity: 0, transform: "scale(0.95)" },
      duration: 300,
      easing: "ease-in",
    },
  },
  blur: {
    enter: {
      from: { opacity: 0, filter: "blur(10px)" },
      to: { opacity: 1, filter: "blur(0)" },
      duration: 300,
      easing: "ease",
    },
    leave: {
      from: { opacity: 1, filter: "blur(0)" },
      to: { opacity: 0, filter: "blur(10px)" },
      duration: 300,
      easing: "ease",
    },
  },
};

function initBuiltinPresets(): void {
  for (const [name, preset] of Object.entries(builtinPresets)) {
    transitionRegistry.set(name, preset);
  }
}

initBuiltinPresets();

/**
 * Register a custom transition preset.
 * Allows users to define their own named transitions in programmatic mode.
 *
 * @param name - Preset name (used in data-volt-surge="name")
 * @param preset - Transition configuration with enter/leave phases
 *
 * @example
 * ```typescript
 * registerTransition('custom-slide', {
 *   enter: {
 *     from: { opacity: 0, transform: 'translateX(-100px)' },
 *     to: { opacity: 1, transform: 'translateX(0)' },
 *     duration: 400,
 *     easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
 *   },
 *   leave: {
 *     from: { opacity: 1, transform: 'translateX(0)' },
 *     to: { opacity: 0, transform: 'translateX(100px)' },
 *     duration: 300,
 *     easing: 'ease-out'
 *   }
 * });
 * ```
 */
export function registerTransition(name: string, preset: TransitionPreset): void {
  if (transitionRegistry.has(name) && Object.hasOwn(builtinPresets, name)) {
    console.warn(`[Volt] Overriding built-in transition preset: "${name}"`);
  }
  transitionRegistry.set(name, preset);
}

/**
 * Get a transition preset by name.
 * Checks both custom and built-in presets.
 *
 * @param name - Preset name
 * @returns Transition preset or undefined if not found
 */
export function getTransition(name: string): Optional<TransitionPreset> {
  return transitionRegistry.get(name);
}

/**
 * Check if a transition preset exists.
 *
 * @param name - Preset name
 * @returns true if the preset is registered
 */
export function hasTransition(name: string): boolean {
  return transitionRegistry.has(name);
}

/**
 * Unregister a custom transition preset.
 * Built-in presets cannot be unregistered.
 *
 * @param name - Preset name
 * @returns true if the preset was removed, false otherwise
 */
export function unregisterTransition(name: string): boolean {
  if (Object.hasOwn(builtinPresets, name)) {
    console.warn(`[Volt] Cannot unregister built-in transition preset: "${name}"`);
    return false;
  }
  return transitionRegistry.delete(name);
}

/**
 * Get all registered transition preset names.
 *
 * @returns Array of preset names
 */
export function getRegisteredTransitions(): string[] {
  return [...transitionRegistry.keys()];
}

/**
 * Parse a transition value string into preset and modifiers.
 * Supports syntax: "presetName", "presetName.duration", "presetName.duration.delay"
 *
 * @param value - Transition value string
 * @returns Parsed transition with preset and optional duration/delay overrides
 *
 * @example
 * ```typescript
 * parseTransitionValue("fade")           // { preset: fadePreset }
 * parseTransitionValue("fade.500")       // { preset: fadePreset, duration: 500 }
 * parseTransitionValue("fade.500.100")   // { preset: fadePreset, duration: 500, delay: 100 }
 * ```
 */
export function parseTransitionValue(value: string): Optional<ParsedTransition> {
  const parts = value.split(".");
  const presetName = parts[0]?.trim();

  if (!presetName) {
    return undefined;
  }

  const preset = getTransition(presetName);
  if (!preset) {
    console.error(`[Volt] Unknown transition preset: "${presetName}"`);
    return undefined;
  }

  const result: ParsedTransition = { preset };

  if (parts.length > 1) {
    const duration = Number.parseInt(parts[1], 10);
    if (!Number.isNaN(duration)) {
      result.duration = duration;
    }
  }

  if (parts.length > 2) {
    const delay = Number.parseInt(parts[2], 10);
    if (!Number.isNaN(delay)) {
      result.delay = delay;
    }
  }

  return result;
}

/**
 * Common easing functions mapped to CSS easing values.
 * Users can also provide custom cubic-bezier strings directly.
 */
export const easings = {
  linear: "linear",
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  "ease-in-sine": "cubic-bezier(0.12, 0, 0.39, 0)",
  "ease-out-sine": "cubic-bezier(0.61, 1, 0.88, 1)",
  "ease-in-out-sine": "cubic-bezier(0.37, 0, 0.63, 1)",
  "ease-in-quad": "cubic-bezier(0.11, 0, 0.5, 0)",
  "ease-out-quad": "cubic-bezier(0.5, 1, 0.89, 1)",
  "ease-in-out-quad": "cubic-bezier(0.45, 0, 0.55, 1)",
  "ease-in-cubic": "cubic-bezier(0.32, 0, 0.67, 0)",
  "ease-out-cubic": "cubic-bezier(0.33, 1, 0.68, 1)",
  "ease-in-out-cubic": "cubic-bezier(0.65, 0, 0.35, 1)",
  "ease-in-quart": "cubic-bezier(0.5, 0, 0.75, 0)",
  "ease-out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
  "ease-in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)",
  "ease-in-quint": "cubic-bezier(0.64, 0, 0.78, 0)",
  "ease-out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
  "ease-in-out-quint": "cubic-bezier(0.83, 0, 0.17, 1)",
  "ease-in-expo": "cubic-bezier(0.7, 0, 0.84, 0)",
  "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
  "ease-in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
  "ease-in-circ": "cubic-bezier(0.55, 0, 1, 0.45)",
  "ease-out-circ": "cubic-bezier(0, 0.55, 0.45, 1)",
  "ease-in-out-circ": "cubic-bezier(0.85, 0, 0.15, 1)",
  "ease-in-back": "cubic-bezier(0.36, 0, 0.66, -0.56)",
  "ease-out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "ease-in-out-back": "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
} as const;

/**
 * Get the CSS easing value for a named easing function.
 * If the input is not a named easing, returns it as-is (for custom cubic-bezier).
 *
 * @param name - Easing name or custom cubic-bezier string
 * @returns CSS easing value
 */
export function getEasing(name: string): string {
  return (easings as Record<string, string>)[name] ?? name;
}

/**
 * Check if reduced motion is preferred by the user.
 * Respects prefers-reduced-motion media query for accessibility.
 *
 * @returns true if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (globalThis.window === undefined || !globalThis.matchMedia) {
    return false;
  }
  return globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Apply duration/delay overrides to a transition phase.
 * Returns a new phase object with merged properties.
 *
 * @param phase - Original transition phase
 * @param duration - Optional duration override
 * @param delay - Optional delay override
 * @returns New phase with overrides applied
 */
export function applyOverrides(phase: TransitionPhase, duration?: number, delay?: number): TransitionPhase {
  return { ...phase, ...(duration !== undefined && { duration }), ...(delay !== undefined && { delay }) };
}
