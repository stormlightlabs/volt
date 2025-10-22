import { signal } from "$core/signal";
import {
  getAnimation,
  getRegisteredAnimations,
  hasAnimation,
  registerAnimation,
  shiftPlugin,
  unregisterAnimation,
} from "$plugins/shift";
import type { AnimationPreset, PluginContext } from "$types/volt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Shift Plugin", () => {
  let container: HTMLDivElement;
  let element: HTMLElement;
  let mockContext: PluginContext;
  let cleanups: Array<() => void>;
  let onMountCallbacks: Array<() => void>;

  beforeEach(() => {
    container = document.createElement("div");
    element = document.createElement("div");
    element.textContent = "Test Content";
    container.append(element);
    document.body.append(container);

    cleanups = [];
    onMountCallbacks = [];

    mockContext = {
      element,
      scope: {},
      addCleanup: (fn) => {
        cleanups.push(fn);
      },
      findSignal: vi.fn(),
      evaluate: vi.fn(),
      lifecycle: {
        onMount: (cb) => {
          onMountCallbacks.push(cb);
          cb();
        },
        onUnmount: vi.fn(),
        beforeBinding: vi.fn(),
        afterBinding: vi.fn(),
      },
    };

    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: false });

    element.style.animation = "";
  });

  afterEach(() => {
    for (const cleanup of cleanups) {
      cleanup();
    }
    cleanups = [];
    onMountCallbacks = [];
    container.remove();
    vi.restoreAllMocks();
  });

  describe("Animation Registry", () => {
    it("should have built-in animation presets", () => {
      expect(hasAnimation("bounce")).toBe(true);
      expect(hasAnimation("shake")).toBe(true);
      expect(hasAnimation("pulse")).toBe(true);
      expect(hasAnimation("spin")).toBe(true);
      expect(hasAnimation("flash")).toBe(true);
    });

    it("should register custom animation", () => {
      const customAnimation: AnimationPreset = {
        keyframes: [{ offset: 0, transform: "scale(1)" }, { offset: 1, transform: "scale(1.5)" }],
        duration: 500,
        iterations: 1,
        timing: "ease",
      };

      registerAnimation("custom", customAnimation);
      expect(hasAnimation("custom")).toBe(true);
      expect(getAnimation("custom")).toEqual(customAnimation);
    });

    it("should unregister custom animation", () => {
      const customAnimation: AnimationPreset = {
        keyframes: [{ offset: 0, opacity: "1" }, { offset: 1, opacity: "0" }],
        duration: 300,
        iterations: 1,
        timing: "linear",
      };

      registerAnimation("temp", customAnimation);
      expect(hasAnimation("temp")).toBe(true);

      const result = unregisterAnimation("temp");
      expect(result).toBe(true);
      expect(hasAnimation("temp")).toBe(false);
    });

    it("should not unregister built-in animation", () => {
      const result = unregisterAnimation("bounce");
      expect(result).toBe(false);
      expect(hasAnimation("bounce")).toBe(true);
    });

    it("should get all registered animations", () => {
      const animations = getRegisteredAnimations();
      expect(animations).toContain("bounce");
      expect(animations).toContain("shake");
      expect(animations).toContain("pulse");
      expect(animations).toContain("spin");
      expect(animations).toContain("flash");
    });

    it("should warn when overriding built-in animation", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const customAnimation: AnimationPreset = {
        keyframes: [{ offset: 0, opacity: "1" }],
        duration: 100,
        iterations: 1,
        timing: "ease",
      };

      registerAnimation("bounce", customAnimation);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Overriding built-in animation preset: \"bounce\""),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Basic Animation Application", () => {
    it("should apply animation on mount", () => {
      shiftPlugin(mockContext, "bounce");

      expect(element.style.animationName).toMatch(/^volt-shift-/);
    });

    it("should use default duration and iterations", () => {
      shiftPlugin(mockContext, "bounce");

      expect(element.style.animationDuration).toBe("100ms");
      expect(element.style.animationIterationCount).toBe("1");
    });

    it("should apply custom duration", () => {
      shiftPlugin(mockContext, "bounce.1000");

      expect(element.style.animationDuration).toBe("1000ms");
    });

    it("should apply custom duration and iterations", () => {
      shiftPlugin(mockContext, "bounce.500.3");

      expect(element.style.animationDuration).toBe("500ms");
      expect(element.style.animationIterationCount).toBe("3");
    });

    it("should handle unknown animation preset", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      shiftPlugin(mockContext, "unknown");

      expect(element.style.animationName).toBe("");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown animation preset: \"unknown\""));

      consoleSpy.mockRestore();
    });

    it("should handle invalid shift value", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      shiftPlugin(mockContext, "");

      expect(element.style.animationName).toBe("");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid shift value"));

      consoleSpy.mockRestore();
    });

    it("should work when Web Animations API is unavailable", () => {
      // @ts-expect-error mutate for test
      element.animate = undefined;

      shiftPlugin(mockContext, "bounce");

      expect(element.style.animationName).toMatch(/^volt-shift-/);
    });

    it("should normalize inline elements for transform animations", () => {
      const span = document.createElement("span");
      span.textContent = "⚙️";
      container.append(span);

      const context: PluginContext = { ...mockContext, element: span };

      shiftPlugin(context, "spin");

      expect(span.style.display).toBe("inline-block");
      expect(span.dataset.voltShiftDisplayManaged).toBe("infinite");
      expect(span.dataset.voltShiftRuns).toBe("1");
      expect(span.style.transformOrigin).toBe("center center");
    });
  });

  describe("Signal-Triggered Animations", () => {
    it("should trigger animation when signal changes to truthy", () => {
      const triggerSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(triggerSignal);

      shiftPlugin(mockContext, "trigger:bounce");

      expect(element.dataset.voltShiftRuns ?? "0").toBe("0");

      triggerSignal.set(true);

      expect(element.dataset.voltShiftRuns).toBe("1");
    });

    it("should not trigger animation when signal stays truthy", () => {
      const triggerSignal = signal(true);
      mockContext.findSignal = vi.fn().mockReturnValue(triggerSignal);

      shiftPlugin(mockContext, "trigger:bounce");

      expect(element.dataset.voltShiftRuns).toBe("1");

      triggerSignal.set(true);

      expect(element.dataset.voltShiftRuns).toBe("1");
    });

    it("should trigger animation on initial mount if signal is truthy", () => {
      const triggerSignal = signal(true);
      mockContext.findSignal = vi.fn().mockReturnValue(triggerSignal);

      shiftPlugin(mockContext, "trigger:bounce");

      expect(element.dataset.voltShiftRuns).toBe("1");
    });

    it("should handle signal not found", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockContext.findSignal = vi.fn().mockReturnValue(void 0);

      shiftPlugin(mockContext, "missing:bounce");

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Signal \"missing\" not found"));
      consoleSpy.mockRestore();
    });

    it("should support custom duration and iterations with signal trigger", () => {
      const triggerSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(triggerSignal);

      shiftPlugin(mockContext, "trigger:bounce.800.2");

      triggerSignal.set(true);

      expect(element.dataset.voltShiftRuns).toBe("1");
      expect(element.style.animationDuration).toBe("800ms");
      expect(element.style.animationIterationCount).toBe("2");
    });
  });

  describe("Accessibility", () => {
    it("should respect prefers-reduced-motion", () => {
      globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true });

      shiftPlugin(mockContext, "bounce");

      expect(element.style.animationName).toBe("");
    });

    it("should not animate when prefers-reduced-motion is active and signal triggers", () => {
      globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true });

      const triggerSignal = signal(false);
      mockContext.findSignal = vi.fn().mockReturnValue(triggerSignal);

      shiftPlugin(mockContext, "trigger:bounce");

      triggerSignal.set(true);

      expect(element.style.animationName).toBe("");
    });
  });

  describe("Animation Cleanup", () => {
    it("should clear inline animation after it completes", async () => {
      vi.useFakeTimers();

      shiftPlugin(mockContext, "bounce");

      expect(element.style.animationName).toMatch(/^volt-shift-/);

      await vi.advanceTimersByTimeAsync(120);

      expect(element.style.animationName).toBe("");
      expect(element.style.animationFillMode).toBe("");

      vi.useRealTimers();
    });

    it("should cleanup signal subscription", () => {
      const triggerSignal = signal(false);
      const unsubscribe = vi.fn();
      triggerSignal.subscribe = vi.fn().mockReturnValue(unsubscribe);

      mockContext.findSignal = vi.fn().mockReturnValue(triggerSignal);

      shiftPlugin(mockContext, "trigger:bounce");

      expect(cleanups).toHaveLength(1);

      cleanups[0]();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe("Built-in Animations", () => {
    it("should have bounce animation with correct keyframes", () => {
      const bounce = getAnimation("bounce");
      expect(bounce).toBeDefined();
      expect(bounce?.keyframes.length).toBeGreaterThan(0);
      expect(bounce?.duration).toBe(100);
      expect(bounce?.iterations).toBe(1);
    });

    it("should have shake animation with correct keyframes", () => {
      const shake = getAnimation("shake");
      expect(shake).toBeDefined();
      expect(shake?.keyframes.length).toBeGreaterThan(0);
      expect(shake?.duration).toBe(500);
    });

    it("should have pulse animation with infinite iterations", () => {
      const pulse = getAnimation("pulse");
      expect(pulse).toBeDefined();
      expect(pulse?.iterations).toBe(Number.POSITIVE_INFINITY);
    });

    it("should have spin animation with infinite iterations", () => {
      const spin = getAnimation("spin");
      expect(spin).toBeDefined();
      expect(spin?.iterations).toBe(Number.POSITIVE_INFINITY);
      expect(spin?.timing).toBe("linear");
    });

    it("should have flash animation", () => {
      const flash = getAnimation("flash");
      expect(flash).toBeDefined();
      expect(flash?.duration).toBe(1000);
    });
  });
});
